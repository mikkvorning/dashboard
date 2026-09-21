import type { ComponentType } from 'react';
import type { NameType } from 'recharts/types/component/DefaultTooltipContent';
import type { CustomTooltipProps } from '@tremor/react/dist/components/chart-elements/common/CustomTooltipProps';

import { formatCompact, getScale } from './format';

export type SelectionKind =
  | 'Månedstrend'
  | 'Budget vs. Realiseret'
  | 'Ansvar'
  | 'Formål'
  | 'KontoMap6';

export type TooltipPayloadItem = NonNullable<
  CustomTooltipProps['payload']
>[number];

type StageHoverCandidate = (kind: SelectionKind, name?: string | null) => void;

type ChartTooltipProps = {
  active: CustomTooltipProps['active'];
  payload: CustomTooltipProps['payload'];
  label: CustomTooltipProps['label'];
};

type DonutTooltipProps = {
  active: CustomTooltipProps['active'];
  payload: CustomTooltipProps['payload'];
};

const toDisplayLabel = (label: NameType | undefined): string | null => {
  if (typeof label === 'string' || typeof label === 'number') {
    return String(label);
  }

  return null;
};

const formatTooltipValue = (
  value: string | number | Array<string | number> | undefined,
): string => {
  if (typeof value === 'number') {
    return formatCompact(value, {
      scale: getScale(value, 'kr.'),
      digits: 1,
    }).full;
  }

  if (Array.isArray(value)) {
    return value.join(' / ');
  }

  return String(value ?? '');
};

export const createChartSelectionTooltip = (
  kind: SelectionKind,
  stageHoverCandidate: StageHoverCandidate,
): ComponentType<ChartTooltipProps> => {
  return ({ active, payload, label }: ChartTooltipProps) => {
    if (!active || !payload?.length) {
      stageHoverCandidate(kind, null);
      return null;
    }

    const hoverLabel = Array.isArray(label)
      ? label.join(' / ')
      : toDisplayLabel(label);
    if (hoverLabel) {
      stageHoverCandidate(kind, hoverLabel);
    }

    return (
      <div className='rounded-tremor-default border border-tremor-border bg-tremor-background px-3 py-2 shadow-tremor-dropdown'>
        <p className='text-xs uppercase tracking-[0.12em] text-tremor-content-subtle'>
          {hoverLabel ?? ''}
        </p>
        <div className='mt-1 space-y-1'>
          {payload.map((item, index) => (
            <p
              key={`${String(item.name ?? 'serie')}-${index}`}
              className='text-sm text-tremor-content-strong'
            >
              <span className='font-semibold'>
                {typeof item.name === 'string' || typeof item.name === 'number'
                  ? String(item.name)
                  : 'Serie'}
                :{' '}
              </span>
              <span>{formatTooltipValue(item.value)}</span>
            </p>
          ))}
        </div>
      </div>
    );
  };
};

export const createDonutSelectionTooltip = (
  stageHoverCandidate: StageHoverCandidate,
): ComponentType<DonutTooltipProps> => {
  return ({ active, payload }: DonutTooltipProps) => {
    if (!active || !payload?.length) {
      stageHoverCandidate('KontoMap6', null);
      return null;
    }

    const first = payload[0];
    if (!first) {
      return null;
    }

    const fallbackName =
      first.payload && typeof first.payload.name === 'string'
        ? first.payload.name
        : null;

    const nameCandidate =
      typeof first.name === 'string' ? first.name : fallbackName;

    if (!nameCandidate) {
      return null;
    }

    stageHoverCandidate('KontoMap6', nameCandidate);

    return (
      <div className='rounded-tremor-default border border-tremor-border bg-tremor-background px-3 py-2 shadow-tremor-dropdown'>
        <p className='text-xs uppercase tracking-[0.12em] text-tremor-content-subtle'>
          {nameCandidate}
        </p>
        <p className='mt-1 text-sm font-semibold text-tremor-content-strong'>
          {formatTooltipValue(first.value)}
        </p>
      </div>
    );
  };
};
