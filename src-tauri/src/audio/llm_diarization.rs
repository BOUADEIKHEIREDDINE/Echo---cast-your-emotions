use crate::audio::transcript_types::TranscriptBlock;
use crate::llm;
use log::warn;
use serde::Deserialize;
use tauri::AppHandle;
use uuid::Uuid;

/// LLM-powered diarization of a raw transcript.
///
/// Returns a list of transcript blocks and the unique speaker names.
pub async fn llm_diarize_transcript(
    app: &AppHandle,
    transcript: &str,
) -> Result<(Vec<TranscriptBlock>, Vec<String>), String> {
    // Build a single prompt string – the LLM integration uses plain text prompts.
    const INSTRUCTIONS: &str = r#"
You are a transcript diarization engine. You receive a raw transcript of a conversation between multiple people and return a structured JSON array identifying each speaker turn.

General behavior:
- Think in terms of *turns*: a turn is one short utterance by a single speaker (one sentence or a small group of very closely related sentences).
- Prefer **many short turns** over a single long block when the text naturally alternates (for example: question → answer → follow‑up question → answer).
- Whenever the text clearly sounds like two people talking (for example: greetings and back‑and‑forth questions like \"How are you?\" / \"I'm good, and you?\"), alternate between \"Speaker 1\" and \"Speaker 2\" instead of keeping everything as \"Speaker 1\".

Signals for speaker changes:
- Question / answer exchanges
- Topic or perspective shifts (\"I\" vs \"you\", \"we\" vs \"you all\")
- Conversational markers such as \"right\", \"exactly\", \"so anyway\", \"okay but\", etc.
- Name mentions or explicit addressing (\"John,\", \"Doctor,\", \"Excuse me,\" etc.)

Labeling rules:
- Assign generic labels: \"Speaker 1\", \"Speaker 2\", \"Speaker 3\", etc.
- Reuse the same label consistently for the same voice throughout the conversation.
- Do NOT invent content. Only use the exact words from the transcript.

Concrete example:
Input transcript:
\"Hello my friend. Hello. How are you? I'm good, how are you? How's the school going? It's going great. How about you? Is your job going well?\"

Correct JSON output:
[
  { \"speaker\": \"Speaker 1\", \"text\": \"Hello my friend.\" },
  { \"speaker\": \"Speaker 2\", \"text\": \"Hello.\" },
  { \"speaker\": \"Speaker 1\", \"text\": \"How are you?\" },
  { \"speaker\": \"Speaker 2\", \"text\": \"I'm good, how are you?\" },
  { \"speaker\": \"Speaker 1\", \"text\": \"How's the school going?\" },
  { \"speaker\": \"Speaker 2\", \"text\": \"It's going great.\" },
  { \"speaker\": \"Speaker 1\", \"text\": \"How about you?\" },
  { \"speaker\": \"Speaker 2\", \"text\": \"Is your job going well?\" }
]

Output rules:
- Return ONLY valid JSON. No markdown, no explanation, no trailing text.
- Each array element must have: { \"speaker\": \"Speaker N\", \"text\": \"...\" }.
- Keep punctuation and wording from the original transcript; only split and label.

Response format:
[
  { \"speaker\": \"Speaker 1\", \"text\": \"...\" },
  { \"speaker\": \"Speaker 2\", \"text\": \"...\" }
]

If you truly cannot detect multiple speakers, return the full text as a single block with \"Speaker 1\".
"#;

    let prompt = format!(
        "{instructions}\n\nTranscript:\n\"\"\"\n{transcript}\n\"\"\"",
        instructions = INSTRUCTIONS,
        transcript = transcript
    );

    let raw = llm::run_llm_with_active_mode(app, &prompt).await?;

    #[derive(Debug, Deserialize)]
    struct LlmBlock {
        speaker: String,
        text: String,
    }

    let parsed: Vec<LlmBlock> = serde_json::from_str(&raw)
        .map_err(|e| format!("Failed to parse diarization JSON: {}", e))?;

    if parsed.is_empty() {
        return Err("LLM diarization returned empty result".to_string());
    }

    let mut speakers: Vec<String> = Vec::new();
    let mut blocks: Vec<TranscriptBlock> = Vec::new();

    for block in parsed {
        let mut speaker_name = block.speaker.trim().to_string();
        if speaker_name.is_empty() {
            speaker_name = "Speaker 1".to_string();
        }

        if !speakers.contains(&speaker_name) {
            speakers.push(speaker_name.clone());
        }

        blocks.push(TranscriptBlock {
            id: Uuid::new_v4().to_string(),
            speaker: speaker_name,
            text: block.text,
            start_time: None,
            end_time: None,
        });
    }

    if blocks.is_empty() {
        warn!("LLM diarization produced no usable blocks; falling back");
        return Err("No usable blocks from LLM diarization".to_string());
    }

    Ok((blocks, speakers))
}

