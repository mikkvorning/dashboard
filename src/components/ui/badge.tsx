import React from 'react';

import { cx } from '../../lib/utils';

const baseBadgeClass =
  'inline-flex items-center rounded-tremor-small px-2 py-1 text-xs font-medium ring-1 ring-inset';

type BadgeColor =
  | 'gray'
  | 'slate'
  | 'zinc'
  | 'stone'
  | 'amber'
  | 'emerald'
  | 'blue'
  | 'rose';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  color?: BadgeColor;
}

const badgeColorClasses: Record<BadgeColor, string> = {
  gray: 'bg-gray-50 text-gray-700 ring-gray-300 dark:bg-gray-900 dark:text-gray-300 dark:ring-gray-700',
  slate:
    'bg-slate-50 text-slate-700 ring-slate-300 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700',
  zinc: 'bg-zinc-50 text-zinc-700 ring-zinc-300 dark:bg-zinc-900 dark:text-zinc-300 dark:ring-zinc-700',
  stone:
    'bg-stone-50 text-stone-700 ring-stone-300 dark:bg-stone-900 dark:text-stone-300 dark:ring-stone-700',
  amber:
    'bg-amber-50 text-amber-700 ring-amber-300 dark:bg-amber-900 dark:text-amber-300 dark:ring-amber-700',
  emerald:
    'bg-emerald-50 text-emerald-700 ring-emerald-300 dark:bg-emerald-900 dark:text-emerald-300 dark:ring-emerald-700',
  blue: 'bg-blue-50 text-blue-700 ring-blue-300 dark:bg-blue-900 dark:text-blue-300 dark:ring-blue-700',
  rose: 'bg-rose-50 text-rose-700 ring-rose-300 dark:bg-rose-900 dark:text-rose-300 dark:ring-rose-700',
};

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, color = 'gray', ...props }, forwardedRef) => (
    <span
      ref={forwardedRef}
      className={cx(baseBadgeClass, badgeColorClasses[color], className)}
      tremor-id='tremor-raw'
      {...props}
    />
  ),
);

Badge.displayName = 'Badge';

type BadgeDeltaType = 'increase' | 'decrease' | 'unchanged';

interface BadgeDeltaProps extends React.HTMLAttributes<HTMLSpanElement> {
  deltaType?: BadgeDeltaType;
  isIncreasePositive?: boolean;
}

const deltaClasses = {
  positive:
    'bg-emerald-50 text-emerald-700 ring-emerald-300 dark:bg-emerald-900 dark:text-emerald-300 dark:ring-emerald-700',
  negative:
    'bg-rose-50 text-rose-700 ring-rose-300 dark:bg-rose-900 dark:text-rose-300 dark:ring-rose-700',
  neutral:
    'bg-gray-50 text-gray-700 ring-gray-300 dark:bg-gray-900 dark:text-gray-300 dark:ring-gray-700',
};

const BadgeDelta = React.forwardRef<HTMLSpanElement, BadgeDeltaProps>(
  (
    { className, deltaType = 'unchanged', isIncreasePositive = true, ...props },
    forwardedRef,
  ) => {
    const tone =
      deltaType === 'unchanged'
        ? 'neutral'
        : deltaType === 'increase'
          ? isIncreasePositive
            ? 'positive'
            : 'negative'
          : isIncreasePositive
            ? 'negative'
            : 'positive';

    return (
      <span
        ref={forwardedRef}
        className={cx(baseBadgeClass, deltaClasses[tone], className)}
        tremor-id='tremor-raw'
        {...props}
      />
    );
  },
);

BadgeDelta.displayName = 'BadgeDelta';

export { Badge, BadgeDelta, type BadgeDeltaType, type BadgeProps };
