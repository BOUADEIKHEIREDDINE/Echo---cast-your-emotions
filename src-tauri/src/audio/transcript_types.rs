use serde::{Deserialize, Serialize};

/// Single transcript block used by the transcript editor.
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

/// Result returned to the frontend: list of blocks + unique speakers.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TranscriptResult {
    pub blocks: Vec<TranscriptBlock>,
    pub speakers: Vec<String>,
}

