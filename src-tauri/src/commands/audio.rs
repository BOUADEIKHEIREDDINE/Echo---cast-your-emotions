use std::path::PathBuf;

use tauri::{command, AppHandle};

use crate::audio::{process_recording, write_transcription};

#[command]
pub fn transcribe_audio_file(app: AppHandle, file_path: String) -> Result<String, String> {
    let path = PathBuf::from(&file_path);

    if !path.exists() {
        return Err("Audio file not found".to_string());
    }

    let ext = path
        .extension()
        .and_then(|e| e.to_str())
        .map(|e| e.to_lowercase())
        .unwrap_or_default();

    if ext != "wav" {
        return Err("Only .wav audio files are supported for transcription.".to_string());
    }

    let result = process_recording(&app, &path).map_err(|e| e.to_string())?;

    write_transcription(&app, &result).map_err(|e| e.to_string())?;

    Ok(result)
}

