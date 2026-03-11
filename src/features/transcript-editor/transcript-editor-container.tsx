import { useEffect, useMemo, useState } from 'react';
import { useLocation } from '@tanstack/react-router';
import { TranscriptEditor } from './transcript-editor';
import { useTranscriptProcessor } from './hooks';
import type { TranscriptBlock, TranscriptEditorState } from './types';

export const TranscriptEditorContainer = () => {
  const location = useLocation();

  // Get initial state from navigation
  const initialState: TranscriptEditorState = (location.state as any) || {
    blocks: [],
    speakers: ['Speaker 1'],
    originalAudioPath: undefined,
  };

  const [blocks, setBlocks] = useState<TranscriptBlock[]>(initialState.blocks);
  const [speakers, setSpeakers] = useState<string[]>(initialState.speakers);
  const [isProcessing, setIsProcessing] = useState(false);

  const { processAudio, isLoading: processingLoading, error } = useTranscriptProcessor();

  // Process audio if provided and no blocks are loaded yet
  useEffect(() => {
    if (initialState.originalAudioPath && blocks.length === 0) {
      const processAudioFile = async () => {
        setIsProcessing(true);
        const result = await processAudio(initialState.originalAudioPath!);
        if (result) {
          setBlocks(result.blocks);
          setSpeakers(result.speakers);
        }
        setIsProcessing(false);
      };

      processAudioFile();
    }
  }, [initialState.originalAudioPath, blocks.length, processAudio]);

  const handleBlockChange = (blockId: string, newText: string) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === blockId ? { ...b, text: newText } : b))
    );
  };

  const handleSpeakerChange = (blockId: string, newSpeaker: string) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === blockId ? { ...b, speaker: newSpeaker } : b))
    );
  };

  const handleAddSpeaker = (name: string) => {
    if (!speakers.includes(name)) {
      setSpeakers((prev) => [...prev, name]);
    }
  };

  const handleRenameSpeaker = (oldName: string, newName: string) => {
    if (!speakers.includes(newName)) {
      setSpeakers((prev) => prev.map((s) => (s === oldName ? newName : s)));
      setBlocks((prev) =>
        prev.map((b) => (b.speaker === oldName ? { ...b, speaker: newName } : b))
      );
    }
  };

  const handleRemoveSpeaker = (name: string) => {
    setSpeakers((prev) => prev.filter((s) => s !== name));
    if (speakers.length > 1) {
      const newSpeaker = speakers.find((s) => s !== name) || speakers[0];
      setBlocks((prev) =>
        prev.map((b) => (b.speaker === name ? { ...b, speaker: newSpeaker } : b))
      );
    }
  };

  const handleDownload = () => {
    let text = '';
    blocks.forEach((block) => {
      if (block.text.trim()) {
        text += `${block.speaker}: ${block.text}\n\n`;
      }
    });

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', 'transcript.txt');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (isProcessing || processingLoading) {
    return (
      <div className="flex items-center justify-center w-full h-screen bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-foreground">Processing audio and detecting speakers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center w-full h-screen bg-background">
        <div className="text-center space-y-4 max-w-md">
          <p className="text-destructive font-semibold">Error processing audio</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <TranscriptEditor
      blocks={blocks}
      onBlockChange={handleBlockChange}
      onSpeakerChange={handleSpeakerChange}
      speakers={speakers}
      onAddSpeaker={handleAddSpeaker}
      onRenameSpeaker={handleRenameSpeaker}
      onRemoveSpeaker={handleRemoveSpeaker}
      onDownload={handleDownload}
    />
  );
};
