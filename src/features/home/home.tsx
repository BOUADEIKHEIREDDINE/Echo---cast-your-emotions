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
import { useRecordingNavigation } from './hooks/use-recording-navigation';

export const Home = () => {
    const { shortcut: recordShortcut } = useShortcut(SHORTCUT_CONFIGS.record);
    const { t } = useTranslation();

    // Setup listener for recording completion and navigate to editor
    useRecordingNavigation();

    return (
        <main className="relative flex h-full flex-col items-center">
            <div className="mt-20 flex w-full max-w-5xl flex-1 flex-col items-center space-y-6">
                <Page.Header className="flex flex-col items-center text-center">
                    <Typography.MainTitle
                        className="pb-4 flex flex-col items-center"
                        data-testid="home-title"
                    >
                        <span className="text-[#e2e8f0] text-base md:text-lg">
                            {t('Welcome to')}
                        </span>
                        <span className="echo-radiant-text text-4xl md:text-5xl font-bold echo-float inline-block">
                            Echo
                        </span>
                    </Typography.MainTitle>
                    <Typography.Paragraph className="text-sm text-white max-w-xl">
                        {t(
                            'Echo will use its magic on your default microphone to capture your emotions.'
                        )}
                    </Typography.Paragraph>
                </Page.Header>

                <MicDisconnectedBanner />

                <div className="grid w-full max-w-4xl gap-6 md:grid-cols-2">
                    <div className="space-y-2 flex flex-col items-center">
                        <Typography.Title className="echo-radiant-text text-lg">
                            {t('Live input')}
                        </Typography.Title>
                        <div className="echo-gradient-border w-full max-w-md">
                            <div className="echo-gradient-border-inner relative flex h-full w-full flex-col items-center gap-4 bg-card p-6">
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
                    </div>

                    <FileTranscription />
                </div>

                <div className="flex w-full justify-center">
                    <History />
                </div>
            </div>

            <Statistics className="absolute right-4 top-0" />
            <Onboarding recordShortcut={recordShortcut} />
        </main>
    );
};
