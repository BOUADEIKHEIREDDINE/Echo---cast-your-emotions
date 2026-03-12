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
        <SidebarProvider defaultOpen={true} className="min-h-screen">
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
                    'bg-sidebar',
                    'text-sidebar-foreground',
                    'md:peer-data-[state=expanded]:pl-[16rem]',
                    'md:peer-data-[state=collapsed]:pl-8'
                )}
            >
                <div className="absolute left-4 top-4 z-20">
                    <SidebarTrigger className="bg-white/80 hover:bg-white shadow-sm" />
                </div>
                <div className="w-full px-6 pb-10" data-testid="murmure-content">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.22, ease: 'easeOut' }}
                            className="h-full"
                        >
                            <Outlet />
                        </motion.div>
                    </AnimatePresence>
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
