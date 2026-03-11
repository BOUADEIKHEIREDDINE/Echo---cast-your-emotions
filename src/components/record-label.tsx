import { RenderKeys } from '@/components/render-keys.tsx';
import { Typography } from '@/components/typography.tsx';
import { useTranslation } from '@/i18n';
import { useRecordModeState } from '@/features/settings/system/record-mode-settings/hooks/use-record-mode-state.ts';
import {
    useShortcut,
    SHORTCUT_CONFIGS,
} from '@/features/settings/shortcuts/hooks/use-shortcut.ts';
import { Mic } from 'lucide-react';
import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

export const RecordLabel = () => {
    const { recordMode } = useRecordModeState();
    const { shortcut: recordShortcut } = useShortcut(SHORTCUT_CONFIGS.record);
    const { t } = useTranslation();
    const [isUiRecording, setIsUiRecording] = useState(false);

    const handleToggleClick = async () => {
        try {
            await invoke('toggle_standard_recording_from_ui');
            setIsUiRecording((prev) => !prev);
        } catch (error) {
            console.error('toggle_standard_recording_from_ui failed', error);
        }
    };

    return (
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
            <Typography.Paragraph className="text-xs m-0">
                {recordMode === 'push_to_talk' ? (
                    <>
                        {t('Hold')} <RenderKeys keyString={recordShortcut} />
                        {t(' to record')}
                    </>
                ) : (
                    <>
                        {t('Toggle')} <RenderKeys keyString={recordShortcut} />
                        {t(' to start/stop recording')}
                    </>
                )}
            </Typography.Paragraph>
            <button
                type="button"
                onClick={handleToggleClick}
                className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary text-secondary-foreground hover:bg-accent hover:text-foreground transition-colors px-2 py-1 text-[10px] font-medium"
                aria-label={t('Toggle recording')}
            >
                <Mic className={isUiRecording ? 'w-3 h-3 text-red-500' : 'w-3 h-3'} />
                <span>{t('Toggle recording')}</span>
            </button>
        </div>
    );
};
