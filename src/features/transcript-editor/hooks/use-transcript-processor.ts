import { invoke } from '@tauri-apps/api/core';
import { useCallback, useState } from 'react';
import type { TranscriptBlock } from '../types';

interface TranscriptResult {
  blocks: TranscriptBlock[];
  speakers: string[];
}

export const useTranscriptProcessor = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processAudio = useCallback(
    async (audioPath: string): Promise<TranscriptResult | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await invoke<TranscriptResult>(
          'process_audio_with_speaker_detection',
          {
            audioPath,
          }
        );

        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(`Failed to process audio: ${errorMessage}`);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    processAudio,
    isLoading,
    error,
  };
};
