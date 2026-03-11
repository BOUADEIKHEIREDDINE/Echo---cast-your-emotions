use crate::audio::helpers::read_wav_samples;
use crate::audio::silence_detection::detect_speaker_turns;
use crate::audio::types::AudioState;
use crate::engine::transcription_engine::TranscriptionEngine;
use crate::engine::ParakeetModelParams;
use crate::{engine::ParakeetEngine, model::Model};
use serde::{Deserialize, Serialize};
use std::path::Path;
use std::sync::Arc;
use tauri::{command, AppHandle, Manager};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TranscriptBlock {
    pub id: String,
    pub speaker: String,
    pub text: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub start_time: Option<f32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub end_time: Option<f32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TranscriptResult {
    pub blocks: Vec<TranscriptBlock>,
    pub speakers: Vec<String>,
}

/// Processes an audio file and returns transcript blocks with speaker turns
/// detected using silence-based segmentation
#[command]
pub fn process_audio_with_speaker_detection(
    app: AppHandle,
    audio_path: String,
) -> Result<TranscriptResult, String> {
    let path = Path::new(&audio_path);
    
    // Read audio samples
    let samples = read_wav_samples(path)
        .map_err(|e| format!("Failed to read audio: {}", e))?;

    // Detect silence intervals (silence gaps indicate speaker turns)
    let silence_intervals =
        detect_speaker_turns(&samples, 16000, 0.02, 500);

    // Transcribe audio
    let audio_state = app.state::<AudioState>();
    let transcribed_text = {
        let mut engine_guard = audio_state.engine.lock();
        if engine_guard.is_none() {
            let model = app.state::<Arc<Model>>();
            let model_path = model
                .get_model_path()
                .map_err(|e| format!("Failed to get model path: {}", e))?;

            let mut new_engine = ParakeetEngine::new();
            new_engine
                .load_model_with_params(&model_path, ParakeetModelParams::int8())
                .map_err(|e| format!("Failed to load model: {}", e))?;

            *engine_guard = Some(new_engine);
        }

        let engine = engine_guard
            .as_mut()
            .ok_or("Engine not loaded")?;

        let result = engine.transcribe_samples(samples, None)
            .map_err(|e| format!("Transcription failed: {}", e))?;
        
        result.text
    };

    // Create blocks based on silence intervals
    let mut blocks = Vec::new();
    let mut speakers = Vec::new();

    if silence_intervals.is_empty() {
        // No silence detected, treat entire transcription as one speaker
        let speaker_name = "Speaker 1".to_string();
        speakers.push(speaker_name.clone());
        blocks.push(TranscriptBlock {
            id: Uuid::new_v4().to_string(),
            speaker: speaker_name,
            text: transcribed_text,
            start_time: Some(0.0),
            end_time: None,
        });
    } else {
        // Split transcription into segments based on silence
        // Simple approach: divide text roughly by number of silence intervals
        let mut text_segments = divide_text_by_silence(&transcribed_text, silence_intervals.len());
        
        for (idx, (start_time, end_time)) in silence_intervals.iter().enumerate() {
            let speaker_name = format!("Speaker {}", idx + 1);
            if !speakers.contains(&speaker_name) {
                speakers.push(speaker_name.clone());
            }

            let text = text_segments
                .pop()
                .unwrap_or_default();

            if !text.trim().is_empty() {
                blocks.push(TranscriptBlock {
                    id: Uuid::new_v4().to_string(),
                    speaker: speaker_name,
                    text,
                    start_time: Some(*start_time),
                    end_time: Some(*end_time),
                });
            }
        }

        // Add remaining text as last speaker
        if let Some(remaining) = text_segments.pop() {
            if !remaining.trim().is_empty() {
                let speaker_name = format!("Speaker {}", silence_intervals.len() + 1);
                speakers.push(speaker_name.clone());
                blocks.push(TranscriptBlock {
                    id: Uuid::new_v4().to_string(),
                    speaker: speaker_name,
                    text: remaining,
                    start_time: silence_intervals.last().map(|(_, end)| *end),
                    end_time: None,
                });
            }
        }
    }

    Ok(TranscriptResult { blocks, speakers })
}

/// Simple heuristic to divide text into segments
/// In a real system, we'd use timestamps from the model
fn divide_text_by_silence(text: &str, num_segments: usize) -> Vec<String> {
    let words: Vec<&str> = text.split_whitespace().collect();
    let words_per_segment = (words.len() + num_segments) / (num_segments + 1);

    let mut segments = Vec::new();
    let mut i = 0;

    while i < words.len() {
        let end = (i + words_per_segment).min(words.len());
        let segment = words[i..end].join(" ");
        segments.push(segment);
        i = end;
    }

    segments
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_divide_text() {
        let text = "word1 word2 word3 word4 word5";
        let segments = divide_text_by_silence(text, 2);
        assert!(!segments.is_empty());
    }
}
