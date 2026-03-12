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
            <div className="echo-gradient-border w-full max-w-md h-full">
                <div className="echo-gradient-border-inner rounded-xl bg-card p-6 flex flex-col items-center gap-4 w-full h-full">
                    <Typography.Paragraph className="text-center text-muted-foreground">
                        {t(
                            'Choose a local WAV file to transcribe it with the same pipeline as live input.'
                        )}
                    </Typography.Paragraph>
                    <Button
                        onClick={handleSelectFile}
                        disabled={isTranscribing}
                        className="gap-2 bg-gradient-to-r from-[#9B7FE8] via-[#5BC8DC] to-[#7C5CBF] text-white hover:from-[#8a6fe0] hover:via-[#4fb7cc] hover:to-[#6d4bb8] border-0"
                    >
                        <Upload className="w-4 h-4" />
                        {isTranscribing
                            ? t('Transcribing...')
                            : t('Select an audio file (.wav)')}
                    </Button>
                </div>
            </div>
        </div>
    );
};

