import { Outlet, useLocation } from '@tanstack/react-router';
import {
    SidebarProvider,
    SidebarInset,
    SidebarTrigger,
} from '../../components/sidebar';
import { AppSidebar } from './app-sidebar/app-sidebar';
import clsx from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';
import { Bounce, ToastContainer } from 'react-toastify';
import { AccessibilityListener } from './listeners/accessibility-listener';
import { RecordingErrorListener } from './listeners/recording-error-listener';
import { LlmErrorListener } from './listeners/llm-error-listener';

export const Layout = () => {
    const location = useLocation();
    return (
        <SidebarProvider
            defaultOpen={true}
            className="min-h-screen bg-gradient-to-br from-[#667eea] to-[#764ba2] dark"
        >
            <AccessibilityListener />
            <RecordingErrorListener />
            <LlmErrorListener />
            <AppSidebar />
            <SidebarInset
                className={clsx(
                    'pr-8',
                    'pt-8',
                    'flex',
                    'min-h-screen',
                    'text-white',
                    'md:peer-data-[state=expanded]:pl-[16rem]',
                    'md:peer-data-[state=collapsed]:pl-8'
                )}
            >
                <div className="absolute left-4 top-4 z-20">
                    <SidebarTrigger className="bg-white/80 hover:bg-white shadow-sm" />
                </div>
                <div className="w-full px-4 pb-12">
                    <div className="max-w-[1200px] mx-auto" data-testid="murmure-content">
                        <div className="echo-magical-card bg-white text-[#2d3748] rounded-[20px] shadow-[0_20px_60px_rgba(0,0,0,0.3)] p-8 space-y-6">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={location.pathname}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    transition={{ duration: 0.22, ease: 'easeOut' }}
                                >
                                    <Outlet />
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </SidebarInset>
            <ToastContainer
                position="bottom-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick={false}
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="dark"
                transition={Bounce}
            />
        </SidebarProvider>
    );
};
