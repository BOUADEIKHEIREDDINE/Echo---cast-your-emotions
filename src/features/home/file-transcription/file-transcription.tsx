import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { open } from '@tauri-apps/plugin-dialog';
import { Upload } from 'lucide-react';
import { Button } from '@/components/button';
import { Typography } from '@/components/typography';
import { useTranslation } from '@/i18n';
import { toast } from 'react-toastify';

export const FileTranscription = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [isTranscribing, setIsTranscribing] = useState(false);

    const handleSelectFile = async () => {
        try {
            const selected = await open({
                multiple: false,
                filters: [
                    {
                        name: 'Audio',
                        extensions: ['wav'],
                    },
                ],
            });

            if (!selected) return;

            const filePath = Array.isArray(selected) ? selected[0] : selected;
            if (!filePath) return;

            setIsTranscribing(true);

            navigate({
                to: '/transcript-editor',
                state: {
                    originalAudioPath: filePath,
                    blocks: [],
                    speakers: ['Speaker 1'],
                } as never,
            });
        } catch {
            toast.error(t('Failed to transcribe audio file.'));
        } finally {
            setIsTranscribing(false);
        }
    };

    return (
        <div className="space-y-2 flex flex-col items-center">
            <Typography.Title className="echo-radiant-text text-lg">
                {t('Transcribe an audio file')}
            </Typography.Title>
            <div className="rounded-md border border-border p-6 flex flex-col items-center gap-4 w-full max-w-md">
                <Typography.Paragraph className="text-center text-muted-foreground">
                    {t(
                        'Choose a local WAV file to transcribe it with the same pipeline as live input.'
                    )}
                </Typography.Paragraph>
                <Button
                    onClick={handleSelectFile}
                    disabled={isTranscribing}
                    className="gap-2"
                >
                    <Upload className="w-4 h-4" />
                    {isTranscribing
                        ? t('Transcribing...')
                        : t('Select an audio file (.wav)')}
                </Button>
            </div>
        </div>
    );
};

