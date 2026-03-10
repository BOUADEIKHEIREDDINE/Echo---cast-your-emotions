import clsx from 'clsx';
import React from 'react';
import { Button, buttonVariants } from './button';
import { VariantProps } from 'class-variance-authority';

export const Page = {
    Header: ({
        children,
        className,
        ...props
    }: React.HTMLAttributes<HTMLDivElement>) => {
        return (
            <div className={clsx(className)} {...props}>
                {children}
            </div>
        );
    },
    PrimaryButton: ({
        children,
        className,
        ...props
    }: React.ComponentProps<'button'> &
        VariantProps<typeof buttonVariants> & {
            asChild?: boolean;
        }) => {
        return (
            <Button
                variant="outline"
                className={clsx(
                    'bg-gradient-to-br from-[#667eea] to-[#764ba2] hover:from-[#5a67d8] hover:to-[#764ba2] px-8 text-white border-none shadow-[0_10px_25px_rgba(102,126,234,0.4)]',
                    className
                )}
                size="lg"
                {...props}
            >
                {children}
            </Button>
        );
    },
    SecondaryButton: ({
        children,
        className,
        ...props
    }: React.ComponentProps<'button'> &
        VariantProps<typeof buttonVariants> & {
            asChild?: boolean;
        }) => {
        return (
            <Button variant="outline" className={className} {...props}>
                {children}
            </Button>
        );
    },
};
