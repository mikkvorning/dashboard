import type { ComponentProps, ReactNode } from 'react';

import { SparkAreaChart } from '@tremor/react';

import { Card } from './ui/card';
import { Text, Title } from './ui/text';

type KpiSparkChartProps = ComponentProps<typeof SparkAreaChart>;

type KpiCardProps = {
  title: ReactNode;
  metric: ReactNode;
  footer: ReactNode;
  sparkChartProps?: KpiSparkChartProps;
};

const isPrimitiveMetric = (value: ReactNode): value is string | number =>
  typeof value === 'string' || typeof value === 'number';

export function KpiCard({
  title,
  metric,
  footer,
  sparkChartProps,
}: KpiCardProps) {
  return (
    <Card className='dd-grid-enter h-full'>
      <div className='flex h-full flex-col'>
        <Title className='dd-section-header mt-0'>{title}</Title>

        <div className='grid min-h-0 flex-1 grid-rows-[3rem,minmax(0,1fr),3rem] items-end'>
          <div className='overflow-hidden'>
            {isPrimitiveMetric(metric) ? (
              <div className='m-0 flex items-start overflow-hidden font-display text-4xl leading-none tracking-tight text-datadein-marine'>
                {metric}
              </div>
            ) : (
              <div className='m-0 flex items-start overflow-hidden'>
                {metric}
              </div>
            )}
          </div>
          <div className='flex min-h-0 justify-start overflow-hidden'>
            {sparkChartProps ? (
              <SparkAreaChart {...sparkChartProps} />
            ) : (
              <div />
            )}
          </div>
          <div className='flex justify-start overflow-hidden'>
            {typeof footer === 'string' ? (
              <Text className='m-0 font-body text-dd-body text-tremor-content-subtle'>
                {footer}
              </Text>
            ) : (
              footer
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
