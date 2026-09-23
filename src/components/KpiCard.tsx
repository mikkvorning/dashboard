import type { ComponentProps, ReactNode } from 'react';

import { Card, Metric, SparkAreaChart, Text } from '@tremor/react';

type KpiSparkChartProps = ComponentProps<typeof SparkAreaChart>;

type KpiCardProps = {
  title: ReactNode;
  metric: ReactNode;
  footer: ReactNode;
  sparkChartProps?: KpiSparkChartProps;
  metricClassName?: string;
};

const isPrimitiveMetric = (value: ReactNode): value is string | number =>
  typeof value === 'string' || typeof value === 'number';

export function KpiCard({
  title,
  metric,
  footer,
  sparkChartProps,
  metricClassName,
}: KpiCardProps) {
  return (
    <Card className='dd-grid-enter h-full'>
      <div className='flex h-full flex-col'>
        <div className='flex h-12 flex-none items-start justify-start overflow-hidden font-bold'>
          {title}
        </div>

        <div className='grid min-h-0 flex-1 grid-rows-[3rem,minmax(0,1fr),3rem] items-end'>
          <div className=' overflow-hidden'>
            {isPrimitiveMetric(metric) ? (
              <Metric
                className={`m-0 flex  items-start overflow-hidden${metricClassName ? ` ${metricClassName}` : ''}`}
              >
                {metric}
              </Metric>
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
