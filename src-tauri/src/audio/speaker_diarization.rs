use log::{debug, info};
use ndarray::{Array1, Array2, ArrayViewD};

/// Represents a speaker turn detected using VAD-based diarization
#[derive(Debug, Clone)]
pub struct SpeakerTurn {
    pub speaker_id: usize,
    pub start_time: f32,    // in seconds
    pub end_time: f32,      // in seconds
    pub text: String,
}

/// Speaker segments detected by VAD
#[derive(Debug, Clone)]
pub struct SpeechSegment {
    pub start_sample: usize,
    pub end_sample: usize,
    pub start_time: f32,
    pub end_time: f32,
}

/// Detects speech segments using improved VAD analysis
/// Returns timestamps of speech/silence boundaries
pub fn detect_speech_segments(
    samples: &[f32],
    sample_rate: usize,
    threshold: f32,
) -> Vec<SpeechSegment> {
    // Window size for analysis (~20ms for 16kHz = 320 samples)
    let window_size = (sample_rate as f32 * 0.02) as usize;
    let mut segments = Vec::new();
    let mut in_speech = false;
    let mut segment_start: Option<usize> = None;

    // Calculate energy/RMS for each window
    for window_idx in 0..(samples.len() / window_size) {
        let start = window_idx * window_size;
        let end = (start + window_size).min(samples.len());
        let window = &samples[start..end];

        // Calculate power (RMS)
        let power: f32 = window.iter().map(|s| s * s).sum::<f32>() / window.len() as f32;
        let is_speech = power.sqrt() > threshold;

        match (in_speech, is_speech) {
            (false, true) => {
                // Speech starts
                segment_start = Some(start);
                in_speech = true;
            }
            (true, false) => {
                // Speech ends
                if let Some(start) = segment_start {
                    let start_time = start as f32 / sample_rate as f32;
                    let end_time = end as f32 / sample_rate as f32;
                    segments.push(SpeechSegment {
                        start_sample: start,
                        end_sample: end,
                        start_time,
                        end_time,
                    });
                }
                in_speech = false;
                segment_start = None;
            }
            _ => {}
        }
    }

    // Handle case where audio ends while still in speech
    if in_speech {
        if let Some(start) = segment_start {
            let start_time = start as f32 / sample_rate as f32;
            let end_time = samples.len() as f32 / sample_rate as f32;
            segments.push(SpeechSegment {
                start_sample: start,
                end_sample: samples.len(),
                start_time,
                end_time,
            });
        }
    }

    debug!(
        "Detected {} speech segments from {} samples",
        segments.len(),
        samples.len()
    );
    segments
}

/// Detects speaker changes using silence gaps between speech
/// Longer gaps indicate different speakers (conversation pattern)
pub fn detect_speaker_changes(
    speech_segments: &[SpeechSegment],
    gap_threshold_ms: u64,
) -> Vec<usize> {
    let mut speaker_boundaries = vec![0]; // First segment is speaker 0
    let gap_threshold_secs = gap_threshold_ms as f32 / 1000.0;

    for i in 0..speech_segments.len().saturating_sub(1) {
        let gap = speech_segments[i + 1].start_time - speech_segments[i].end_time;

        // If gap is larger than threshold, it's likely a speaker change
        if gap > gap_threshold_secs {
            speaker_boundaries.push(i + 1);
            debug!("Speaker change detected at segment {} (gap: {:.3}s)", i + 1, gap);
        }
    }

    speaker_boundaries
}

/// Segments transcript blocks based on speech segments
/// Assigns speaker IDs based on detected speaker changes
pub fn segment_by_vad(
    transcribed_text: &str,
    speech_segments: Vec<SpeechSegment>,
    gap_threshold_ms: u64,
) -> Vec<SpeakerTurn> {
    if speech_segments.is_empty() {
        return vec![SpeakerTurn {
            speaker_id: 0,
            start_time: 0.0,
            end_time: 0.0,
            text: transcribed_text.to_string(),
        }];
    }

    let speaker_boundaries = detect_speaker_changes(&speech_segments, gap_threshold_ms);
    let mut speaker_turns = Vec::new();

    // Simple heuristic: assign text proportionally to speech segments
    let words: Vec<&str> = transcribed_text.split_whitespace().collect();
    let total_segment_duration: f32 = speech_segments.iter()
        .map(|s| s.end_time - s.start_time)
        .sum();

    let mut word_idx = 0;

    for (seg_idx, segment) in speech_segments.iter().enumerate() {
        let segment_duration = segment.end_time - segment.start_time;
        let proportion = segment_duration / total_segment_duration;
        let words_for_segment = ((words.len() as f32 * proportion).ceil() as usize).max(1);

        let segment_text = words
            .iter()
            .skip(word_idx)
            .take(words_for_segment)
            .copied()
            .collect::<Vec<_>>()
            .join(" ");

        // Determine speaker ID based on boundaries
        let speaker_id = speaker_boundaries
            .iter()
            .filter(|&&boundary| boundary <= seg_idx)
            .count()
            .saturating_sub(1);

        if !segment_text.trim().is_empty() {
            speaker_turns.push(SpeakerTurn {
                speaker_id,
                start_time: segment.start_time,
                end_time: segment.end_time,
                text: segment_text,
            });
        }

        word_idx += words_for_segment;
    }

    debug!(
        "Segmented into {} speaker turns with {} unique speakers",
        speaker_turns.len(),
        speaker_turns.iter().map(|t| t.speaker_id).max().unwrap_or(0) + 1
    );

    speaker_turns
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_speech_detection() {
        let sample_rate = 16000;
        let mut samples = vec![0.01; 16000]; // 1 second of low-amplitude signal
        samples.extend(vec![0.001; 8000]); // 0.5 seconds of silence
        samples.extend(vec![0.02; 16000]); // 1 second of speech

        let segments = detect_speech_segments(&samples, sample_rate, 0.01);
        assert!(!segments.is_empty());
    }

    #[test]
    fn test_speaker_boundary_detection() {
        let segments = vec![
            SpeechSegment {
                start_sample: 0,
                end_sample: 16000,
                start_time: 0.0,
                end_time: 1.0,
            },
            SpeechSegment {
                start_sample: 24000,
                end_sample: 40000,
                start_time: 1.5,
                end_time: 2.5,
            },
        ];

        let boundaries = detect_speaker_changes(&segments, 300);
        assert_eq!(boundaries.len(), 2); // Two speakers
    }
}
