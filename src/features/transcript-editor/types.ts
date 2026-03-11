export interface TranscriptBlock {
  id: string;
  speaker: string;
  text: string;
  startTime?: number;
  endTime?: number;
}

export interface TranscriptEditorState {
  blocks: TranscriptBlock[];
  speakers: string[];
  originalAudioPath?: string;
}
