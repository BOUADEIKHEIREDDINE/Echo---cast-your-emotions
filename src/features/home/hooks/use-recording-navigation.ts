import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import type { UnlistenFn } from '@tauri-apps/api/event';
import { listen } from '@tauri-apps/api/event';

/**
 * Hook that listens for recording completion event and navigates to transcript editor
 * The event includes the audio file path which is passed to the editor for processing
 */
export const useRecordingNavigation = () => {
  const navigate = useNavigate();

  useEffect(() => {
    let unlisten: UnlistenFn | null = null;

    const setupListener = async () => {
      try {
        unlisten = await listen<{ audioPath: string }>(
          'recording-complete',
          (event) => {
            const { audioPath } = event.payload;
            navigate({
              to: '/transcript-editor',
              // Cast required because TanStack Router infers a
              // stricter state updater type for this route.
              state: {
                originalAudioPath: audioPath,
                blocks: [],
                speakers: ['Speaker 1'],
              } as never,
            });
          }
        );
      } catch (error) {
        console.error('Failed to setup recording listener:', error);
      }
    };

    setupListener();

    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, [navigate]);
};
