import { useCallback, useRef, useState } from 'react';
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

export type Selection = {
  kind: SelectionKind;
  name: string;
};

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

// The tooltip is not just decorative: it is the bridge from a visible Recharts
// datapoint to the app's shared selection state. We use custom tooltip content to
// stage the active datum before committing it on chart click.
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
        <p className='text-sm  font-bold'>{hoverLabel ?? ''}</p>
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
        <p className='text-sm  font-bold '>{nameCandidate}</p>
        <p className='mt-1 text-sm font-semibold text-tremor-content-strong'>
          {formatTooltipValue(first.value)}
        </p>
      </div>
    );
  };
};

export const createChartSelectionTooltips = (
  stageHoverCandidate: StageHoverCandidate,
) => ({
  monthlyTrend: createChartSelectionTooltip('Månedstrend', stageHoverCandidate),
  budgetVsRealized: createChartSelectionTooltip(
    'Budget vs. Realiseret',
    stageHoverCandidate,
  ),
  topAnsvar: createChartSelectionTooltip('Ansvar', stageHoverCandidate),
  topFormaal: createChartSelectionTooltip('Formål', stageHoverCandidate),
  donut: createDonutSelectionTooltip(stageHoverCandidate),
});

export const useChartSelection = () => {
  const [selection, setSelection] = useState<Selection | null>(null);
  const [hoverCandidates, setHoverCandidates] = useState<
    Partial<Record<Selection['kind'], string>>
  >({});
  const previousSelectionKindRef = useRef<Selection['kind'] | null>(null);
  const chartRootsRef = useRef<
    Partial<Record<Selection['kind'], HTMLDivElement | null>>
  >({});
  const skipProgrammaticCommitKindRef = useRef<Selection['kind'] | null>(null);

  const setChartRootRef = useCallback(
    (kind: Selection['kind']) => (node: HTMLDivElement | null) => {
      chartRootsRef.current[kind] = node;
    },
    [],
  );

  const clearChartInternalSelection = useCallback((kind: Selection['kind']) => {
    const chartRoot = chartRootsRef.current[kind];
    if (!chartRoot) {
      return;
    }

    const clickTargets = new Set<Element>();
    const rootCandidates = [
      chartRoot,
      chartRoot.querySelector('.recharts-wrapper'),
      chartRoot.querySelector('.recharts-surface'),
      ...Array.from(chartRoot.querySelectorAll('.recharts-sector')),
      ...Array.from(chartRoot.querySelectorAll('.recharts-rectangle')),
      ...Array.from(chartRoot.querySelectorAll('.recharts-active-shape')),
    ];

    rootCandidates.forEach((candidate) => {
      if (candidate instanceof Element) {
        clickTargets.add(candidate);
      }
    });

    if (!clickTargets.size) {
      return;
    }

    skipProgrammaticCommitKindRef.current = kind;
    clickTargets.forEach((target) => {
      target.dispatchEvent(
        new MouseEvent('click', { bubbles: true, cancelable: true }),
      );
    });

    queueMicrotask(() => {
      if (skipProgrammaticCommitKindRef.current === kind) {
        skipProgrammaticCommitKindRef.current = null;
      }
    });
  }, []);

  const markSelection = useCallback(
    (kind: Selection['kind'] | null) => {
      const previousKind = previousSelectionKindRef.current;
      if (previousKind && previousKind !== kind) {
        clearChartInternalSelection(previousKind);
      }
      previousSelectionKindRef.current = kind;
    },
    [clearChartInternalSelection],
  );

  const resetPreviousSelection = useCallback(() => {
    const previousKind = previousSelectionKindRef.current;
    if (previousKind) {
      clearChartInternalSelection(previousKind);
    }
    previousSelectionKindRef.current = null;
  }, [clearChartInternalSelection]);

  const updateSelection = useCallback(
    (kind: Selection['kind'], name: string) => {
      setSelection((current) => {
        if (current?.kind === kind && current.name === name) {
          return current;
        }
        return { kind, name };
      });
      markSelection(kind);
    },
    [markSelection],
  );

  const stageHoverCandidate = useCallback(
    (kind: Selection['kind'], name?: string | null) => {
      setHoverCandidates((previous) => {
        if (!name) {
          if (!previous[kind]) {
            return previous;
          }
          const next = { ...previous };
          delete next[kind];
          return next;
        }

        if (previous[kind] === name) {
          return previous;
        }

        return { ...previous, [kind]: name };
      });
    },
    [],
  );

  const commitStagedSelection = useCallback(
    (kind: Selection['kind']) => {
      const candidate = hoverCandidates[kind];
      if (candidate) {
        updateSelection(kind, candidate);
      }
    },
    [hoverCandidates, updateSelection],
  );

  const handleChartCommit = useCallback(
    (kind: Selection['kind']) => {
      if (skipProgrammaticCommitKindRef.current === kind) {
        skipProgrammaticCommitKindRef.current = null;
        return;
      }

      commitStagedSelection(kind);
    },
    [commitStagedSelection],
  );

  return {
    selection,
    setSelection,
    hoverCandidates,
    setChartRootRef,
    updateSelection,
    stageHoverCandidate,
    handleChartCommit,
    resetPreviousSelection,
  };
};
