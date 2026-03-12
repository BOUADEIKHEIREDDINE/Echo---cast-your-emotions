use crate::audio::helpers::read_wav_samples;
use crate::audio::llm_diarization::llm_diarize_transcript;
use crate::audio::transcript_types::{TranscriptBlock, TranscriptResult};
use crate::audio::types::AudioState;
use crate::engine::transcription_engine::TranscriptionEngine;
use crate::engine::ParakeetModelParams;
use crate::{engine::ParakeetEngine, history, model::Model};
use std::path::Path;
use std::sync::Arc;
use tauri::{command, AppHandle, Manager};
use uuid::Uuid;

#[command]
pub fn save_transcript_to_file(file_path: String, content: String) -> Result<(), String> {
    std::fs::write(&file_path, content).map_err(|e| format!("Failed to save file: {}", e))?;
    Ok(())
}

/// Processes an audio file and returns transcript blocks with speaker turns
/// detected using an LLM-powered diarization pass.
#[command]
pub async fn process_audio_with_speaker_detection(
    app: AppHandle,
    audio_path: String,
) -> Result<TranscriptResult, String> {
    let path = Path::new(&audio_path);

    // Read audio samples
    let samples = read_wav_samples(path)
        .map_err(|e| format!("Failed to read audio: {}", e))?;

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

    // Run LLM-powered diarization; on error, fall back to a single block.
    let (blocks, speakers) = match llm_diarize_transcript(&app, &transcribed_text).await {
        Ok(result) => result,
        Err(err) => {
            // Fallback: single block, single speaker.
            log::warn!("LLM diarization failed ({}), falling back to single speaker", err);
            let speaker_name = "Speaker 1".to_string();
            let block = TranscriptBlock {
                id: Uuid::new_v4().to_string(),
                speaker: speaker_name.clone(),
                text: transcribed_text,
                start_time: None,
                end_time: None,
            };
            (vec![block], vec![speaker_name])
        }
    };

    // Store a flattened version of the transcript in history so it appears in "Recent activity".
    // This keeps only text (no audio, no per-speaker metadata) and respects the 5-entry limit.
    let combined_text = blocks
        .iter()
        .map(|b| b.text.trim())
        .filter(|t| !t.is_empty())
        .collect::<Vec<_>>()
        .join("\n\n");
    let snapshot_blocks: Vec<history::types::HistoryBlockSnapshot> = blocks
        .iter()
        .map(|b| history::types::HistoryBlockSnapshot {
            speaker: b.speaker.clone(),
            text: b.text.clone(),
        })
        .collect();

    if let Err(err) = history::history::add_transcription_with_snapshot(
        &app,
        combined_text,
        snapshot_blocks,
        speakers.clone(),
    ) {
        log::warn!("Failed to store transcript in history: {}", err);
    }

    Ok(TranscriptResult { blocks, speakers })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn transcript_result_shape_stable() {
        let block = TranscriptBlock {
            id: "id".to_string(),
            speaker: "Speaker 1".to_string(),
            text: "hello".to_string(),
            start_time: None,
            end_time: None,
        };
        let result = TranscriptResult {
            blocks: vec![block],
            speakers: vec!["Speaker 1".to_string()],
        };
        assert_eq!(result.blocks.len(), 1);
        assert_eq!(result.speakers.len(), 1);
    }
}
