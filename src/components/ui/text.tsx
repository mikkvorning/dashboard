import React from 'react';

import { cx } from '../../lib/utils';

const baseBodyTextClass = 'text-sm text-gray-600 dark:text-gray-400';

const Text = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, forwardedRef) => (
  <p
    ref={forwardedRef}
    className={cx(baseBodyTextClass, className)}
    tremor-id='tremor-raw'
    {...props}
  />
));

Text.displayName = 'Text';

const Subtitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, forwardedRef) => (
  <p
    ref={forwardedRef}
    className={cx(baseBodyTextClass, className)}
    tremor-id='tremor-raw'
    {...props}
  />
));

Subtitle.displayName = 'Subtitle';

const Title = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, forwardedRef) => (
  <p
    ref={forwardedRef}
    className={cx(
      'text-base font-semibold text-gray-900 dark:text-gray-50',
      className,
    )}
    tremor-id='tremor-raw'
    {...props}
  />
));

Title.displayName = 'Title';

export { Subtitle, Text, Title };
