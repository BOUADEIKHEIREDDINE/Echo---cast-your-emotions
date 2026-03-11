use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct HistoryEntry {
    pub id: u64,
    pub timestamp: i64,
    pub text: String,
    #[serde(default)]
    pub blocks: Option<Vec<HistoryBlockSnapshot>>,
    #[serde(default)]
    pub speakers: Option<Vec<String>>,
}

/// Minimal snapshot of a transcript block stored in history.
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct HistoryBlockSnapshot {
    pub speaker: String,
    pub text: String,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct HistoryData {
    pub entries: Vec<HistoryEntry>,
    pub next_id: u64,
}

impl Default for HistoryData {
    fn default() -> Self {
        Self {
            entries: Vec::new(),
            next_id: 1,
        }
    }
}
