import {
    useShortcut,
    SHORTCUT_CONFIGS,
} from '../settings/shortcuts/hooks/use-shortcut';
import { AudioVisualizer } from './audio-visualizer/audio-visualizer';
import { History } from './history/history';
import { Page } from '@/components/page';
import { Typography } from '@/components/typography';
import { Statistics } from './statistics/statistics';
import { useTranslation } from '@/i18n';
import { Onboarding } from '../onboarding/onboarding';
import { RecordLabel } from '@/components/record-label';
import { MicDisconnectedBanner } from './mic-disconnected-banner/mic-disconnected-banner';
import { FileTranscription } from './file-transcription/file-transcription';

export const Home = () => {
    const { shortcut: recordShortcut } = useShortcut(SHORTCUT_CONFIGS.record);

    const { t } = useTranslation();
    return (
        <main className="space-y-4 relative">
            <Page.Header>
                <Typography.MainTitle className="pb-4" data-testid="home-title">
                    <span className="text-[#2d3748]">{t('Welcome to')}</span>{' '}
                    <span className="echo-radiant-text text-4xl md:text-5xl font-bold echo-float inline-block">
                        Echo
                    </span>
                </Typography.MainTitle>
                <Statistics className="absolute -top-4 -right-4" />
                <Onboarding recordShortcut={recordShortcut} />
            </Page.Header>
            <MicDisconnectedBanner />

            <Typography.Paragraph className="text-sm text-muted-foreground">
                {t(
                    'Echo will use its magic on your default microphone to capture your emotions.'
                )}
            </Typography.Paragraph>

            <div className="space-y-4">
                <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2 flex flex-col items-center">
                        <Typography.Title className="echo-radiant-text text-lg">
                            {t('Live input')}
                        </Typography.Title>
                        <div className="rounded-md border border-border p-2 space-y-4 relative w-full max-w-md">
                            <div className="relative h-24 w-full">
                                <div className="absolute left-1/2 top-1/2 w-[80%] -translate-x-1/2 -translate-y-1/2">
                                    <AudioVisualizer
                                        bars={30}
                                        rows={17}
                                        audioPixelWidth={5}
                                        audioPixelHeight={4}
                                    />
                                </div>
                            </div>
                            <RecordLabel />
                        </div>
                    </div>

                    <FileTranscription />
                </div>

                <div className="flex justify-center">
                    <History />
                </div>
            </div>
        </main>
    );
};

