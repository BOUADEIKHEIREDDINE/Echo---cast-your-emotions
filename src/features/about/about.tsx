import { motion } from 'framer-motion';
import { Github, ExternalLink as ExternalLinkIcon, Zap } from 'lucide-react';
import StarryBackground from './starry-background/starry-background';
import { ExternalLink } from '@/components/external-link';
import { useGetVersion } from '../layout/hooks/use-get-version';
import { useTranslation } from '@/i18n';
import appIcon from '@/assets/app-icon.png';

const containerVariants = {
    hidden: { opacity: 1 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.15 },
    },
};

const sectionVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: 'easeOut' as const },
    },
};

const logoVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: {
            type: 'spring' as const,
            stiffness: 200,
            damping: 20,
        },
    },
};

const FEATURE_LINKS = [
    {
        titleKey: 'GitHub',
        descriptionKey: 'View the source code and contribute to the project.',
        href: 'https://github.com/BOUADEIKHEIREDDINE/Echo---cast-your-emotions',
        ariaLabel: 'View Echo on GitHub',
        icon: Github,
        gradient: 'from-purple-500 via-violet-500 to-indigo-500',
        glowColor: 'rgba(139, 92, 246, 0.3)',
        hoverGlow: 'rgba(139, 92, 246, 0.15)',
        iconColor: 'text-violet-400',
        borderHover: 'hover:border-violet-500/50',
        iconBg: 'rgba(139, 92, 246, 0.15)',
    },
    {
        titleKey: 'Features',
        descriptionKey: 'Privacy-first, local speech recognition.',
        href: '#',
        ariaLabel: 'Echo features',
        icon: Zap,
        gradient: 'from-yellow-500 via-amber-500 to-orange-500',
        glowColor: 'rgba(245, 158, 11, 0.3)',
        hoverGlow: 'rgba(245, 158, 11, 0.15)',
        iconColor: 'text-amber-400',
        borderHover: 'hover:border-amber-500/50',
        iconBg: 'rgba(245, 158, 11, 0.15)',
    },
];

export const About = () => {
    const version = useGetVersion();
    const { t } = useTranslation();
    const currentYear = new Date().getFullYear();
    const yearDisplay = currentYear <= 2025 ? '2025' : `2025-${currentYear}`;

    return (
        <main className="isolate relative flex flex-col items-center text-center pt-4">
            <StarryBackground className="fixed inset-0 -z-10" />

            <motion.div
                className="relative z-10 flex flex-col items-center gap-8 max-w-lg px-4"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.div
                    variants={sectionVariants}
                    className="flex flex-col items-center gap-4"
                >
                    <div className="flex items-center justify-center gap-3">
                        <motion.img
                            src={appIcon}
                            alt="Echo - Cast your emotions"
                            className="w-20 h-20"
                            style={{
                                filter: 'drop-shadow(0 0 20px rgba(56, 189, 248, 0.3))',
                            }}
                            variants={logoVariants}
                        />
                        <h1
                            className="text-3xl font-bold tracking-wide"
                            style={{
                                textShadow: '0 0 30px rgba(14, 165, 233, 0.4)',
                            }}
                        >
                            <span className="text-sky-400">
                                Echo
                            </span>
                        </h1>
                    </div>
                    <p className="italic text-sm text-muted-foreground max-w-sm">
                        {t('Private by design.')}
                        <br />
                        {t('Speech recognition that stays on your device.')}
                    </p>
                </motion.div>

                <motion.div
                    variants={sectionVariants}
                    className="w-full space-y-5"
                >
                    <div className="text-center space-y-3">
                        <h2 className="text-xl font-semibold text-foreground tracking-tight">
                            {t('Cast Your Emotions')}
                        </h2>
                        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                            Echo converts your voice into text with precision. Everything stays on your device—no data collection, no tracking, just pure transcription power.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {FEATURE_LINKS.map((link) => {
                            const Icon = link.icon;
                            return (
                                <motion.a
                                    key={link.titleKey}
                                    href={link.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={link.ariaLabel}
                                    className={`group relative flex flex-col items-center gap-3 rounded-2xl border-2 border-border/60 bg-background/50 p-6 overflow-hidden transition-all duration-300 hover:-translate-y-0.5 ${link.borderHover}`}
                                    whileHover={{
                                        boxShadow: `0 0 40px ${link.hoverGlow}, 0 20px 40px -15px rgba(0,0,0,0.5)`,
                                    }}
                                >
                                    <div
                                        className="rounded-xl p-2.5 transition-all duration-300"
                                        style={{
                                            background: `linear-gradient(135deg, ${link.iconBg}, transparent)`,
                                        }}
                                    >
                                        <Icon
                                            className={`w-6 h-6 ${link.iconColor} transition-transform duration-300 group-hover:scale-110`}
                                        />
                                    </div>
                                    <div className="text-center space-y-1">
                                        <h3 className="text-sm font-semibold text-foreground flex items-center justify-center gap-1.5">
                                            {t(link.titleKey)}
                                            <ExternalLinkIcon className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </h3>
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            {t(link.descriptionKey)}
                                        </p>
                                    </div>
                                    <span
                                        className={`inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r ${link.gradient} px-4 py-1.5 text-xs font-semibold text-white transition-all duration-300 group-hover:scale-105`}
                                        style={{
                                            boxShadow: `0 4px 15px ${link.glowColor}`,
                                        }}
                                    >
                                        <Zap className="w-3 h-3" />
                                        {t('Open')}
                                    </span>
                                </motion.a>
                            );
                        })}
                    </div>
                </motion.div>

                <motion.div
                    variants={sectionVariants}
                    className="flex flex-col items-center gap-2 pt-2"
                >
                    <div
                        className="h-px w-full max-w-xs"
                        style={{
                            background:
                                'linear-gradient(to right, transparent, rgb(63 63 70), transparent)',
                        }}
                    />
                    <p className="text-xs text-muted-foreground">v{version || '-'}</p>
                    <p className="text-xs text-muted-foreground">
                        {t('Powered by')}{' '}
                        <span className="text-sky-400/70">
                            {t('NVIDIA Parakeet')}
                        </span>
                        {' · '}
                        <ExternalLink
                            href="https://www.gnu.org/licenses/agpl-3.0.html"
                            className="!text-muted-foreground hover:!text-foreground"
                        >
                            {t('GNU AGPL v3')}
                        </ExternalLink>
                    </p>
                    <p className="text-xs text-muted-foreground">
                        &copy; {yearDisplay} BOUADEI KHEIREDDINE. All rights reserved.
                    </p>
                </motion.div>
            </motion.div>
        </main>
    );
};
