// Tremor Tabs [v1.0.0]

import React from 'react';
import * as TabsPrimitives from '@radix-ui/react-tabs';

import { cx, focusRing } from '../../lib/utils';

const Tabs = (
  props: Omit<
    React.ComponentPropsWithoutRef<typeof TabsPrimitives.Root>,
    'orientation'
  >,
) => {
  return <TabsPrimitives.Root tremor-id='tremor-raw' {...props} />;
};

Tabs.displayName = 'Tabs';

type TabsListVariant = 'line' | 'solid';

const TabsListVariantContext = React.createContext<TabsListVariant>('line');

interface TabsListProps extends React.ComponentPropsWithoutRef<
  typeof TabsPrimitives.List
> {
  variant?: TabsListVariant;
}

const variantStyles: Record<TabsListVariant, string> = {
  line: cx(
    // base
    'flex items-center justify-start border-b',
    // border color
    'border-tremor-border',
  ),
  solid: cx(
    // base
    'inline-flex items-center justify-center rounded-tremor-default p-1',
    // background color
    'bg-tremor-background-subtle',
  ),
};

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitives.List>,
  TabsListProps
>(({ className, variant = 'line', children, ...props }, forwardedRef) => (
  <TabsPrimitives.List
    ref={forwardedRef}
    className={cx(variantStyles[variant], className)}
    {...props}
  >
    <TabsListVariantContext.Provider value={variant}>
      {children}
    </TabsListVariantContext.Provider>
  </TabsPrimitives.List>
));

TabsList.displayName = 'TabsList';

function getVariantStyles(tabVariant: TabsListVariant) {
  switch (tabVariant) {
    case 'line':
      return cx(
        // base
        '-mb-px inline-flex appearance-none items-center justify-center whitespace-nowrap border-0 border-b-2 border-transparent bg-transparent px-3 pb-2 text-sm font-medium shadow-none transition-all',
        // text color
        'text-tremor-content-subtle',
        // hover
        'hover:text-tremor-content-emphasis',
        // border hover
        'hover:border-tremor-border',
        // selected
        'data-[state=active]:border-tremor-brand data-[state=active]:text-tremor-brand',
        // disabled
        'data-disabled:pointer-events-none',
        'data-disabled:text-tremor-content-subtle data-disabled:opacity-50',
      );
    case 'solid':
      return cx(
        // base
        'inline-flex appearance-none items-center justify-center whitespace-nowrap rounded-sm border-0 bg-transparent px-3 py-1 text-sm font-medium ring-1 ring-inset shadow-none transition-all',
        // text color
        'text-tremor-content-subtle',
        // hover
        'hover:text-tremor-content-emphasis',
        // ring
        'ring-transparent',
        // selected
        'data-[state=active]:bg-tremor-background data-[state=active]:text-tremor-content-strong data-[state=active]:shadow-sm',
        // disabled
        'data-disabled:pointer-events-none data-disabled:text-tremor-content-subtle data-disabled:opacity-50',
      );
  }
}

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitives.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitives.Trigger>
>(({ className, children, ...props }, forwardedRef) => {
  const variant = React.useContext(TabsListVariantContext);
  return (
    <TabsPrimitives.Trigger
      ref={forwardedRef}
      className={cx(getVariantStyles(variant), focusRing, className)}
      {...props}
    >
      {children}
    </TabsPrimitives.Trigger>
  );
});

TabsTrigger.displayName = 'TabsTrigger';

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitives.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitives.Content>
>(({ className, ...props }, forwardedRef) => (
  <TabsPrimitives.Content
    ref={forwardedRef}
    className={cx('outline-hidden', focusRing, className)}
    {...props}
  />
));

TabsContent.displayName = 'TabsContent';

export { Tabs, TabsContent, TabsList, TabsTrigger };
