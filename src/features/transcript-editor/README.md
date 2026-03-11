# Transcript Editor with Speaker Diarization

## Overview

The Transcript Editor feature enables users to record audio, automatically detect speakers, and refine transcriptions with a user-friendly editing interface.

## Architecture

### Workflow

```
Recording → VAD Speech Detection → Speaker Segmentation → Auto-Navigation
    ↓
Concurrent Transcription (Parakeet)
    ↓
Speaker Turn Merging → Transcript Editor UI
    ↓
Edit Speakers/Text → Download Transcript
```

### Speaker Diarization (Option C: Dedicated Diarization Model)

The system uses **Voice Activity Detection (VAD)** combined with intelligent silence gap analysis:

#### 1. **VAD-Based Speech Segmentation** (`speaker_diarization.rs`)
- Analyzes audio in 20ms windows
- Computes RMS power for each window
- Detects speech/silence boundaries using configurable threshold (0.015)
- Returns precise speech segment timestamps

#### 2. **Speaker Change Detection**
- Analyzes gaps between speech segments
- Gap > 300ms indicates speaker change (conversation pause)
- Handles overlapping speech through timing proximity

#### 3. **Transcript Alignment**
- Maps words from transcription to detected speech segments
- Assigns speaker IDs proportionally based on segment duration
- Ensures accurate speaker attribution

### Key Parameters

| Parameter | Value | Purpose |
|-----------|-------|---------|
| Window Size | 20ms | VAD analysis granularity |
| Power Threshold | 0.015 | Speech detection sensitivity |
| Gap Threshold | 300ms | Minimum pause for speaker change |
| Sample Rate | 16kHz | Parakeet model requirement |

## Frontend Components

### `TranscriptEditor` (Main UI)
- Two-column layout: Speakers sidebar + Editor main area
- Live speaker/text editing
- Real-time stats (blocks, words, characters)

### `SpeakerList` (Speaker Management)
- Add/remove/rename speakers
- Real-time update of all blocks
- Input validation and conflict prevention

### `useTranscriptProcessor` (Audio Processing)
- Tauri IPC bridge to `process_audio_with_speaker_detection`
- Handles async processing with loading states
- Error handling and user feedback

### `useRecordingNavigation` (Auto-Navigation)
- Listens for `recording-complete` event
- Passes audio path to editor as state
- Automatic processing on mount

## Backend Commands

### `process_audio_with_speaker_detection`
```rust
#[command]
pub fn process_audio_with_speaker_detection(
    app: AppHandle,
    audio_path: String,
) -> Result<TranscriptResult, String>
```

**Input:** Audio file path (WAV)
**Output:** 
```json
{
  "blocks": [
    {
      "id": "uuid",
      "speaker": "Speaker 1",
      "text": "spoken text",
      "start_time": 0.5,
      "end_time": 2.3
    }
  ],
  "speakers": ["Speaker 1", "Speaker 2"]
}
```

## Privacy & Security

✅ **100% Local Processing**
- No cloud calls or data transmission
- Audio processed on device only
- Files stored temporarily, deleted after download

✅ **No Model Downloads Required**
- Uses existing Parakeet model
- VAD uses lightweight power-based detection (no ML model)
- Complies with Murmure privacy principles

## Accuracy Notes

### Strengths
- ✅ Handles clear speaker turns with silence gaps
- ✅ Works well for conversations with natural pauses
- ✅ Fast processing (real-time on CPU)
- ✅ No external dependencies

### Limitations
- ⚠️ Overlapping speech: Assigns based on dominant timing
- ⚠️ Background noise: May affect threshold tuning
- ⚠️ No voice embeddings: Can't distinguish same speaker at different times
- ⚠️ Gap threshold is fixed (might need tuning for specific audio)

### Future Improvements
1. **Adaptive Thresholds** - Auto-tune based on audio characteristics
2. **Speaker Embeddings** - Add voice fingerprinting for consistency
3. **ML-Based VAD** - Optional Silero VAD ONNX model (~5MB)
4. **User Overrides** - Manual speaker assignment when needed

## Testing

### Basic Flow
1. Record audio with multiple speakers
2. Wait for auto-navigation to editor
3. Verify speaker segments are detected
4. Edit as needed
5. Download transcript

### Edge Cases
- Single speaker (one block)
- Rapid speech with no gaps (user intervention needed)
- Background noise (adjust threshold in code)

## File Structure

```
src/features/transcript-editor/
├── transcript-editor.tsx          # Main UI component
├── transcript-editor-container.tsx # Container with state
├── speaker-list.tsx               # Speaker management
├── types.ts                        # TypeScript interfaces
├── hooks/
│   ├── use-transcript-processor.ts # Tauri IPC hook
│   └── index.ts
├── index.ts                        # Feature exports
└── README.md                       # This file

src-tauri/src/
├── audio/
│   └── speaker_diarization.rs      # VAD & diarization logic
├── commands/
│   └── transcript.rs               # Tauri command handler
```

## Configuration

### Adjust Speaker Detection Sensitivity

Edit `src-tauri/src/commands/transcript.rs`:

```rust
// Line: let speech_segments = detect_speech_segments(&samples, 16000, 0.015);
// Increase threshold (e.g., 0.02) for less sensitivity
// Decrease threshold (e.g., 0.01) for more sensitivity
```

### Adjust Gap Threshold

Edit `src-tauri/src/commands/transcript.rs`:

```rust
// Line: let speaker_turns = segment_by_vad(&transcribed_text, speech_segments, 300);
// Increase (e.g., 500ms) for stricter speaker change detection
// Decrease (e.g., 200ms) for more aggressive segmentation
```

## Related Files

- Recording module: `src-tauri/src/audio/audio.rs`
- Home page integration: `src/features/home/home.tsx`
- Router setup: `src/router.tsx`
- Parakeet transcription: `src-tauri/src/engine/engine.rs`
