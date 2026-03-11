use log::debug;

/// Represents a speaker turn detected by silence-based segmentation
#[derive(Debug, Clone)]
pub struct SpeakerTurn {
    pub speaker_id: usize,
    pub start_time: f32,    // in seconds
    pub end_time: f32,      // in seconds
    pub text: String,
}

/// Detects silence intervals and returns speaker turns
/// Assumes each silence marks a new speaker
/// 
/// # Arguments
/// * `samples` - Raw audio samples
/// * `sample_rate` - Sample rate (usually 16000 Hz)
/// * `silence_threshold` - RMS threshold for silence (default ~0.02)
/// * `silence_duration_ms` - Minimum duration to be considered silence (default 500ms)
pub fn detect_speaker_turns(
    samples: &[f32],
    sample_rate: usize,
    silence_threshold: f32,
    silence_duration_ms: u64,
) -> Vec<(f32, f32)> {
    // Window size for RMS calculation (~50ms windows)
    let window_size = (sample_rate as f32 * 0.05) as usize;
    let silence_window_count = ((silence_duration_ms as f32 / 1000.0) * sample_rate as f32
        / window_size as f32) as usize;

    let mut silence_turns = Vec::new();
    let mut silence_start: Option<usize> = None;
    let mut silence_window_count_consecutive = 0;

    // Calculate RMS for each window
    for window_idx in 0..(samples.len() / window_size) {
        let start = window_idx * window_size;
        let end = (start + window_size).min(samples.len());
        let window = &samples[start..end];

        // Calculate RMS
        let sum_squares: f32 = window.iter().map(|s| s * s).sum();
        let rms = (sum_squares / window.len() as f32).sqrt();

        if rms < silence_threshold {
            silence_window_count_consecutive += 1;

            if silence_start.is_none() && silence_window_count_consecutive == 1 {
                silence_start = Some(window_idx);
            }

            // Check if silence duration threshold is met
            if silence_window_count_consecutive >= silence_window_count {
                if let Some(start_idx) = silence_start {
                    let start_time = (start_idx * window_size) as f32 / sample_rate as f32;
                    let end_time = (window_idx * window_size) as f32 / sample_rate as f32;
                    silence_turns.push((start_time, end_time));
                    silence_start = None;
                    silence_window_count_consecutive = 0;
                }
            }
        } else {
            silence_window_count_consecutive = 0;
        }
    }

    debug!(
        "Detected {} silence intervals from {} samples",
        silence_turns.len(),
        samples.len()
    );
    silence_turns
}

/// Segments transcript blocks based on silence intervals
/// Returns speaker turns with text from the original text
pub fn segment_by_silence(
    transcribed_text: &str,
    silence_intervals: Vec<(f32, f32)>,
) -> Vec<SpeakerTurn> {
    if silence_intervals.is_empty() {
        return vec![SpeakerTurn {
            speaker_id: 0,
            start_time: 0.0,
            end_time: 0.0,
            text: transcribed_text.to_string(),
        }];
    }

    let mut speaker_turns = Vec::new();
    let mut current_speaker = 0;

    // For now, create speaker turns based on silence boundaries
    // In a real diarization system, we'd use timestamps from the model
    let mut text_parts = transcribed_text.split_whitespace();
    let mut current_text = String::new();

    for (idx, silence) in silence_intervals.iter().enumerate() {
        // Simple heuristic: assign text to speakers based on silence count
        if !current_text.trim().is_empty() {
            speaker_turns.push(SpeakerTurn {
                speaker_id: current_speaker,
                start_time: if idx == 0 { 0.0 } else { silence_intervals[idx - 1].1 },
                end_time: silence.0,
                text: current_text.trim().to_string(),
            });
        }

        current_speaker += 1;
        current_text.clear();
    }

    // Add final segment
    if !current_text.trim().is_empty() {
        let start_time = silence_intervals
            .last()
            .map(|(_, end)| *end)
            .unwrap_or(0.0);
        speaker_turns.push(SpeakerTurn {
            speaker_id: current_speaker,
            start_time,
            end_time: 0.0,
            text: current_text.trim().to_string(),
        });
    }

    debug!("Segmented into {} speaker turns", speaker_turns.len());
    speaker_turns
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_detect_silence() {
        let sample_rate = 16000;
        let mut samples = vec![0.01; 16000]; // 1 second of low-amplitude signal
        samples.extend(vec![0.001; 8000]); // 0.5 seconds of silence
        samples.extend(vec![0.02; 16000]); // 1 second of speech

        let silences = detect_speaker_turns(&samples, sample_rate, 0.01, 400);
        assert!(!silences.is_empty());
    }
}
