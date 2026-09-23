import React from 'react';

import { cx } from '../../lib/utils';

type FlexJustifyContent =
  | 'start'
  | 'end'
  | 'center'
  | 'between'
  | 'around'
  | 'evenly';

type FlexAlignItems = 'start' | 'end' | 'center' | 'stretch' | 'baseline';

interface FlexProps extends React.HTMLAttributes<HTMLDivElement> {
  justifyContent?: FlexJustifyContent;
  alignItems?: FlexAlignItems;
}

const justifyClassMap: Record<FlexJustifyContent, string> = {
  start: 'justify-start',
  end: 'justify-end',
  center: 'justify-center',
  between: 'justify-between',
  around: 'justify-around',
  evenly: 'justify-evenly',
};

const alignClassMap: Record<FlexAlignItems, string> = {
  start: 'items-start',
  end: 'items-end',
  center: 'items-center',
  stretch: 'items-stretch',
  baseline: 'items-baseline',
};

const Flex = React.forwardRef<HTMLDivElement, FlexProps>(
  (
    { className, justifyContent = 'start', alignItems = 'center', ...props },
    forwardedRef,
  ) => (
    <div
      ref={forwardedRef}
      className={cx(
        'flex',
        justifyClassMap[justifyContent],
        alignClassMap[alignItems],
        className,
      )}
      tremor-id='tremor-raw'
      {...props}
    />
  ),
);

Flex.displayName = 'Flex';

interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  numItems?: number;
  numItemsSm?: number;
  numItemsMd?: number;
  numItemsLg?: number;
}

const gridCols: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-6',
  7: 'grid-cols-7',
  8: 'grid-cols-8',
  9: 'grid-cols-9',
  10: 'grid-cols-10',
  11: 'grid-cols-11',
  12: 'grid-cols-12',
};

const smGridCols: Record<number, string> = {
  1: 'sm:grid-cols-1',
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-3',
  4: 'sm:grid-cols-4',
  5: 'sm:grid-cols-5',
  6: 'sm:grid-cols-6',
  7: 'sm:grid-cols-7',
  8: 'sm:grid-cols-8',
  9: 'sm:grid-cols-9',
  10: 'sm:grid-cols-10',
  11: 'sm:grid-cols-11',
  12: 'sm:grid-cols-12',
};

const mdGridCols: Record<number, string> = {
  1: 'md:grid-cols-1',
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-3',
  4: 'md:grid-cols-4',
  5: 'md:grid-cols-5',
  6: 'md:grid-cols-6',
  7: 'md:grid-cols-7',
  8: 'md:grid-cols-8',
  9: 'md:grid-cols-9',
  10: 'md:grid-cols-10',
  11: 'md:grid-cols-11',
  12: 'md:grid-cols-12',
};

const lgGridCols: Record<number, string> = {
  1: 'lg:grid-cols-1',
  2: 'lg:grid-cols-2',
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4',
  5: 'lg:grid-cols-5',
  6: 'lg:grid-cols-6',
  7: 'lg:grid-cols-7',
  8: 'lg:grid-cols-8',
  9: 'lg:grid-cols-9',
  10: 'lg:grid-cols-10',
  11: 'lg:grid-cols-11',
  12: 'lg:grid-cols-12',
};

const Grid = React.forwardRef<HTMLDivElement, GridProps>(
  (
    { className, numItems, numItemsSm, numItemsMd, numItemsLg, ...props },
    ref,
  ) => (
    <div
      ref={ref}
      className={cx(
        'grid',
        numItems ? gridCols[Math.min(12, Math.max(1, numItems))] : '',
        numItemsSm ? smGridCols[Math.min(12, Math.max(1, numItemsSm))] : '',
        numItemsMd ? mdGridCols[Math.min(12, Math.max(1, numItemsMd))] : '',
        numItemsLg ? lgGridCols[Math.min(12, Math.max(1, numItemsLg))] : '',
        className,
      )}
      tremor-id='tremor-raw'
      {...props}
    />
  ),
);

Grid.displayName = 'Grid';

export { Flex, Grid };
