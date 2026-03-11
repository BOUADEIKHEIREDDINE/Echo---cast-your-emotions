import { invoke } from '@tauri-apps/api/core';
import { useNavigate } from '@tanstack/react-router';
import { Typography } from '@/components/typography';
import { Button } from '@/components/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/dialog';
import { toast } from 'react-toastify';
import { formatTime } from './history.helpers';
import { useHistoryState } from './hooks/use-history-state';
import { InfoIcon, Trash2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/tooltip';
import { useTranslation } from '@/i18n';

export const History = () => {
    const { history } = useHistoryState();
    const { t } = useTranslation();
    const navigate = useNavigate();

    const handleClearHistory = async () => {
        try {
            await invoke('clear_history');
            toast.info(t('History cleared'));
        } catch (error) {
            toast.error(t('Failed to clear history'));
            console.error('Clear history error:', error);
        }
    };

    return (
        <div className="space-y-2 w-full">
            <div className="flex items-center justify-between">
                <Typography.Title className="flex items-center gap-2 echo-radiant-text text-lg">
                    {t('Recent activity')}{' '}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <InfoIcon className="size-4 inline-block text-muted-foreground cursor-pointer" />
                        </TooltipTrigger>
                        <TooltipContent>
                            <Typography.Paragraph className="text-foreground text-xs">
                                {t(
                                    'All audio is deleted. No telemetry, no tracking. Only the last five text transcriptions are stored on your computer.'
                                )}
                            </Typography.Paragraph>
                        </TooltipContent>
                    </Tooltip>
                </Typography.Title>
                <Dialog>
                    <DialogTrigger asChild>
                        <Trash2 className="size-4 cursor-pointer hover:text-foreground text-muted-foreground transition-colors" />
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{t('Clear History')}</DialogTitle>
                            <DialogDescription>
                                {t(
                                    'Are you sure you want to clear all transcription history? This action cannot be undone.'
                                )}
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button
                                    variant="outline"
                                    className="bg-card border border-border hover:bg-accent hover:text-foreground"
                                >
                                    {t('Cancel')}
                                </Button>
                            </DialogClose>
                            <DialogClose asChild>
                                <Button
                                    variant="destructive"
                                    onClick={handleClearHistory}
                                >
                                    {t('Clear')}
                                </Button>
                            </DialogClose>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
            {history.length === 0 ? (
                <Typography.Paragraph>
                    {t('No transcriptions yet')}
                </Typography.Paragraph>
            ) : (
                <div className="space-y-2">
                    {history.map((entry) => (
                        <button
                            key={entry.id}
                            className="w-full text-left rounded-md border border-border p-3 hover:bg-accent cursor-pointer"
                            onClick={() => {
                                if (!entry.text) return;

                                // If we have a full snapshot (from Transcript Editor),
                                // restore blocks/speakers exactly as they were.
                                if (entry.blocks && entry.blocks.length > 0 && entry.speakers) {
                                    navigate({
                                        to: '/transcript-editor',
                                        state: {
                                            originalAudioPath: undefined,
                                            blocks: entry.blocks.map((b, idx) => ({
                                                id: `${entry.id}-${idx}`,
                                                speaker: b.speaker,
                                                text: b.text,
                                            })),
                                            speakers: entry.speakers,
                                        } as never,
                                    });
                                    return;
                                }

                                // Fallback: single Speaker 1 block with the text.
                                navigate({
                                    to: '/transcript-editor',
                                    state: {
                                        originalAudioPath: undefined,
                                        blocks: [
                                            {
                                                id: String(entry.id),
                                                speaker: 'Speaker 1',
                                                text: entry.text,
                                            },
                                        ],
                                        speakers: ['Speaker 1'],
                                    } as never,
                                });
                            }}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <Typography.Paragraph>
                                    {entry.text === '' ? (
                                        <span className="italic text-xs">
                                            {t('(Empty transcription)')}
                                        </span>
                                    ) : entry.text.length > 400 ? (
                                        <>
                                            {entry.text.slice(0, 400)}
                                            {'…'}
                                        </>
                                    ) : (
                                        entry.text
                                    )}
                                </Typography.Paragraph>
                                <Typography.Paragraph className="text-xs block w-20 text-right">
                                    {formatTime(entry.timestamp)}
                                </Typography.Paragraph>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
