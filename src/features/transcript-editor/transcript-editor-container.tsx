import { useEffect, useState } from 'react';
import { useLocation } from '@tanstack/react-router';
import { TranscriptEditor } from './transcript-editor';
import { useTranscriptProcessor } from './hooks';
import type { TranscriptBlock, TranscriptEditorState } from './types';
import { save } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';
import { useTranslation } from 'react-i18next';

export const TranscriptEditorContainer = () => {
  const { t } = useTranslation();
  const location = useLocation();

  // Get initial state from navigation
  const navigationState = (location.state ?? {}) as Partial<TranscriptEditorState>;

  const initialState: TranscriptEditorState = {
    blocks: navigationState.blocks ?? [],
    speakers: navigationState.speakers ?? ['Speaker 1'],
    originalAudioPath: navigationState.originalAudioPath,
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
    const run = async () => {
      const content = blocks
        .map((block) => {
          const text = block.text.trim();
          if (text.length === 0) return null;
          return `${block.speaker}: ${text}`;
        })
        .filter((x): x is string => x !== null)
        .join('\n\n');

      const filePath = await save({
        defaultPath: 'transcript.txt',
        filters: [{ name: 'Text', extensions: ['txt'] }],
      });
      if (!filePath) return;

      await invoke('save_transcript_to_file', {
        filePath,
        content,
      });
    };

    void run();
  };

  if (isProcessing || processingLoading) {
    return (
      <div className="flex items-center justify-center w-full h-screen bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-foreground">
            {t('Processing audio and detecting speakers...')}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center w-full h-screen bg-background">
        <div className="text-center space-y-4 max-w-md">
          <p className="text-destructive font-semibold">{t('Error processing audio')}</p>
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
