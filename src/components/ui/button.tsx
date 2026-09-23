import React from 'react';
import { Slot } from '@radix-ui/react-slot';

import { cx, focusRing } from '../../lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'light';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-blue-500 text-white hover:bg-blue-600 border border-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600 dark:border-blue-500',
  secondary:
    'bg-white text-gray-900 hover:bg-gray-50 border border-gray-300 dark:bg-gray-950 dark:text-gray-50 dark:hover:bg-gray-900 dark:border-gray-800',
  light:
    'bg-transparent text-gray-900 hover:bg-gray-100 border border-transparent dark:text-gray-50 dark:hover:bg-gray-900',
};

const sizeClasses: Record<ButtonSize, string> = {
  xs: 'h-7 px-2.5 text-xs',
  sm: 'h-8 px-3 text-sm',
  md: 'h-9 px-3.5 text-sm',
  lg: 'h-10 px-4 text-sm',
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      asChild,
      variant = 'primary',
      size = 'md',
      type = 'button',
      ...props
    },
    forwardedRef,
  ) => {
    const Component = asChild ? Slot : 'button';
    return (
      <Component
        ref={forwardedRef}
        className={cx(
          'inline-flex shrink-0 items-center justify-center rounded-tremor-small font-medium shadow-xs transition-colors disabled:pointer-events-none disabled:opacity-50',
          focusRing,
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        tremor-id='tremor-raw'
        {...(!asChild ? { type } : {})}
        {...props}
      />
    );
  },
);

Button.displayName = 'Button';

export { Button, type ButtonProps, type ButtonSize, type ButtonVariant };
