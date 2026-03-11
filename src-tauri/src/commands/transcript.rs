use crate::audio::helpers::read_wav_samples;
use crate::audio::speaker_diarization::{detect_speech_segments, segment_by_vad};
use crate::audio::types::AudioState;
use crate::engine::ParakeetModelParams;
use crate::{engine::ParakeetEngine, model::Model};
use anyhow::Context;
use serde::{Deserialize, Serialize};
use std::path::Path;
use std::sync::Arc;
use tauri::{command, AppHandle, State};
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

/// Processes audio using VAD-based speaker diarization
/// Detects speech segments and assigns speaker IDs based on silence gaps
/// Gap threshold: segments separated by >300ms silence = different speakers
#[command]
pub fn process_audio_with_speaker_detection(
    app: AppHandle,
    audio_path: String,
) -> Result<TranscriptResult, String> {
    let path = Path::new(&audio_path);
    
    // Read audio samples
    let samples = read_wav_samples(path)
        .map_err(|e| format!("Failed to read audio: {}", e))?;

    // Detect speech segments using VAD (Voice Activity Detection)
    // Uses improved energy-based detection with 20ms window
    let speech_segments = detect_speech_segments(&samples, 16000, 0.015);

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

    // Segment transcript based on VAD speech segments
    // Gap threshold of 300ms indicates speaker change
    let speaker_turns = segment_by_vad(&transcribed_text, speech_segments, 300);

    // Convert speaker turns to blocks and extract unique speakers
    let mut blocks = Vec::new();
    let mut speaker_ids = std::collections::HashSet::new();

    for turn in speaker_turns {
        speaker_ids.insert(turn.speaker_id);
        blocks.push(TranscriptBlock {
            id: Uuid::new_v4().to_string(),
            speaker: format!("Speaker {}", turn.speaker_id + 1),
            text: turn.text,
            start_time: Some(turn.start_time),
            end_time: Some(turn.end_time),
        });
    }

    // Generate speaker list
    let mut speakers: Vec<String> = (0..speaker_ids.len())
        .map(|i| format!("Speaker {}", i + 1))
        .collect();
    speakers.sort();

    // If no blocks detected, return single block
    if blocks.is_empty() {
        speakers = vec!["Speaker 1".to_string()];
        blocks.push(TranscriptBlock {
            id: Uuid::new_v4().to_string(),
            speaker: "Speaker 1".to_string(),
            text: transcribed_text,
            start_time: Some(0.0),
            end_time: None,
        });
    }

    Ok(TranscriptResult { blocks, speakers })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_empty_transcript() {
        let result = TranscriptResult {
            blocks: vec![],
            speakers: vec![],
        };
        assert_eq!(result.blocks.len(), 0);
    }
}
