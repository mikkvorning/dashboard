import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  AreaChart,
  Badge,
  BadgeDelta,
  BarChart,
  Button,
  Card,
  DonutChart,
  Flex,
  Grid,
  Metric,
  SparkAreaChart,
  Subtitle,
  Tab,
  TabGroup,
  TabList,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Text,
  Title,
} from '@tremor/react';

import {
  createChartSelectionTooltip,
  createDonutSelectionTooltip,
  type SelectionKind,
} from './utils/chartSelection';
import { formatRangeLabel } from './utils/labels';
import {
  type DashboardRangeKey,
  useDashboardRangeData,
} from './hooks/useDashboardRangeData';
import { useFlipCardLoadCycle } from './hooks/useFlipCardLoadCycle';
import {
  formatCompact,
  formatCurrency,
  formatMonthLabel,
  formatNumber,
  getEventName,
  getScale,
} from './utils/format';
import { FlipCard, MIN_LOAD_DELAY } from './components/FlipCard';
import { ChevronUpIcon } from './components/icons/ChevronUpIcon';
import { SortIndicatorIcon } from './components/icons/SortIndicatorIcon';

type Selection = {
  kind: SelectionKind;
  name: string;
};

type ResultRowVariant = 'line' | 'subtotal' | 'total';

type ResultTableRow = {
  id: string;
  name: string;
  realized: number;
  budget: number;
  diff: number;
  diffPct: number;
  variant: ResultRowVariant;
  sourceCategory?: string;
};

type ResultSortKey = 'default' | 'realized' | 'budget' | 'diff' | 'diffPct';

// Keep the range switcher centralized and explicit. The app uses the selected
// period as the source of truth for both data fetching and chart state.
const rangeOptions: DashboardRangeKey[] = ['1Y', '3Y', 'ALL'];
const TOTAL_FLIP_CARDS = 10;

function App() {
  const [selectedRange, setSelectedRange] = useState<DashboardRangeKey>('1Y');
  const [selection, setSelection] = useState<Selection | null>(null);
  const [selectedResultRowId, setSelectedResultRowId] = useState<string | null>(
    null,
  );
  const [hoveredResultRowId, setHoveredResultRowId] = useState<string | null>(
    null,
  );
  const [resultSort, setResultSort] = useState<{
    key: ResultSortKey;
    direction: 'asc' | 'desc';
  }>({ key: 'default', direction: 'desc' });
  const [hoverCandidates, setHoverCandidates] = useState<
    Partial<Record<Selection['kind'], string>>
  >({});
  const previousSelectionKindRef = useRef<Selection['kind'] | null>(null);
  const chartRootsRef = useRef<
    Partial<Record<Selection['kind'], HTMLDivElement | null>>
  >({});
  const skipProgrammaticCommitKindRef = useRef<Selection['kind'] | null>(null);
  const lastResultTriggerRef = useRef<HTMLElement | null>(null);

  const {
    loadToken,
    beginLoadCycle,
    handleCardBackfaceReady,
    areCardsReadyForLoad,
  } = useFlipCardLoadCycle(TOTAL_FLIP_CARDS);

  const { activeData, error, clearError, isLoading, isInitialLoad } =
    useDashboardRangeData({
      selectedRange,
      canCommitRange: loadToken === 0 || areCardsReadyForLoad,
    });

  const handleRangeChange = useCallback(
    (nextRange: DashboardRangeKey) => {
      if (nextRange === selectedRange) return;

      setSelectedRange(nextRange);
      clearError();
      beginLoadCycle();
    },
    [beginLoadCycle, clearError, selectedRange],
  );

  // Normalize chart inputs into a consistent shape before handing them to Tremor.
  // This keeps the UI logic readable and prevents individual chart components from
  // needing to understand the raw payload format.
  const monthSeries = useMemo(
    () =>
      activeData.monthly.map((point) => ({
        ...point,
        monthLabel: formatMonthLabel(point.month),
      })),
    [activeData.monthly],
  );

  const monthlyChartSeries = monthSeries.map((point) => ({
    ...point,
    Beløb: point.Belob,
    Budgetbeløb: point.BudgBelob,
  }));

  const topAnsvarChartSeries = activeData.topAnsvar.map((point) => ({
    ...point,
    Beløb: point.Belob,
  }));

  const topFormaalChartSeries = activeData.topFormaal.map((point) => ({
    ...point,
    Beløb: point.Belob,
  }));

  const costCompositionSeries = activeData.byKontoMap6
    .filter((point) => point.name !== 'Indtægter' && point.Belob !== 0)
    .map((point) => ({
      ...point,
      Beløb: Math.abs(point.Belob),
    }));

  const costCompositionTotal = costCompositionSeries.reduce(
    (sum, point) => sum + point.Beløb,
    0,
  );

  // Resultatopgørelse table: line items in conventional P&L order, with two
  // computed subtotal rows interspersed (Driftsresultat, Resultat før
  // finansielle poster) — pure arithmetic on the categories we already have,
  // no new data fields required. Row shape/ordering takes inspiration from
  // the client's reference layout without reusing any of its figures.
  // Note: BudgBelob per category is a synthesized split (see data/*.json)
  // calibrated to reconcile with the headline KPI totals, not a figure
  // pulled from a real per-category budget source.
  const findKontoMap6 = (name: string) =>
    activeData.byKontoMap6.find((point) => point.name === name);

  const buildRow = (
    id: string,
    name: string,
    realized: number,
    budget: number,
    variant: ResultRowVariant = 'line',
    sourceCategory?: string,
  ): ResultTableRow => {
    // Because cost lines are stored as negative numbers, "realized - budget"
    // being positive means the actual outcome was better than budget in
    // every case: more revenue than planned, or less cost than planned.
    // That lets the whole table share one variance rule instead of
    // special-casing revenue vs. cost rows.
    const diff = realized - budget;
    const diffPct = budget !== 0 ? (diff / Math.abs(budget)) * 100 : 0;
    return {
      id,
      name,
      realized,
      budget,
      diff,
      diffPct,
      variant,
      sourceCategory,
    };
  };

  const indtaegter = findKontoMap6('Indtægter');
  const personale = findKontoMap6('Personaleomkostninger');
  const drift = findKontoMap6('Driftsomkostninger');
  const afskrivninger = findKontoMap6('Af- og nedskrivninger');
  const finansielle = findKontoMap6('Finansielle poster');

  const indtaegterRow = buildRow(
    'indtaegter',
    'Indtægter',
    indtaegter?.Belob ?? 0,
    indtaegter?.BudgBelob ?? 0,
    'line',
    'Indtægter',
  );
  const personaleRow = buildRow(
    'personaleomkostninger',
    'Personaleomkostninger',
    personale?.Belob ?? 0,
    personale?.BudgBelob ?? 0,
    'line',
    'Personaleomkostninger',
  );
  const driftRow = buildRow(
    'driftsomkostninger',
    'Driftsomkostninger',
    drift?.Belob ?? 0,
    drift?.BudgBelob ?? 0,
    'line',
    'Driftsomkostninger',
  );
  const driftsresultatRow = buildRow(
    'driftsresultat',
    'Driftsresultat',
    indtaegterRow.realized + personaleRow.realized + driftRow.realized,
    indtaegterRow.budget + personaleRow.budget + driftRow.budget,
    'subtotal',
  );
  const afskrivningerRow = buildRow(
    'afskrivninger',
    'Af- og nedskrivninger',
    afskrivninger?.Belob ?? 0,
    afskrivninger?.BudgBelob ?? 0,
    'line',
    'Af- og nedskrivninger',
  );
  const resultatFoerFinansielleRow = buildRow(
    'resultat-foer-finansielle',
    'Resultat før finansielle poster',
    driftsresultatRow.realized + afskrivningerRow.realized,
    driftsresultatRow.budget + afskrivningerRow.budget,
    'subtotal',
  );
  const finansielleRow = buildRow(
    'finansielle-poster',
    'Finansielle poster',
    finansielle?.Belob ?? 0,
    finansielle?.BudgBelob ?? 0,
    'line',
    'Finansielle poster',
  );
  const resultatRow = buildRow(
    'resultat',
    'Resultat',
    resultatFoerFinansielleRow.realized + finansielleRow.realized,
    resultatFoerFinansielleRow.budget + finansielleRow.budget,
    'total',
  );

  const resultTableRows = useMemo(
    () => [
      indtaegterRow,
      personaleRow,
      driftRow,
      driftsresultatRow,
      afskrivningerRow,
      resultatFoerFinansielleRow,
      finansielleRow,
      resultatRow,
    ],
    [
      afskrivningerRow,
      driftRow,
      driftsresultatRow,
      finansielleRow,
      indtaegterRow,
      personaleRow,
      resultatFoerFinansielleRow,
      resultatRow,
    ],
  );

  const handleResultSort = useCallback((key: ResultSortKey) => {
    setResultSort((previous) => {
      if (key === 'default') {
        return { key: 'default', direction: 'desc' };
      }

      if (previous.key === key) {
        return {
          key,
          direction: previous.direction === 'desc' ? 'asc' : 'desc',
        };
      }

      return { key, direction: 'desc' };
    });
  }, []);

  const sortedResultTableRows = useMemo(() => {
    if (resultSort.key === 'default') {
      return resultTableRows;
    }

    const lineRows = resultTableRows.filter((row) => row.variant === 'line');
    const nonLineRows = resultTableRows.filter((row) => row.variant !== 'line');

    const sortedLines = [...lineRows].sort((a, b) => {
      const directionMultiplier = resultSort.direction === 'asc' ? 1 : -1;
      const metric =
        resultSort.key === 'realized'
          ? 'realized'
          : resultSort.key === 'budget'
            ? 'budget'
            : resultSort.key === 'diff'
              ? 'diff'
              : 'diffPct';
      const left = a[metric];
      const right = b[metric];

      if (left === right) return 0;
      return left > right ? directionMultiplier : -directionMultiplier;
    });

    return [...sortedLines, ...nonLineRows];
  }, [resultSort.direction, resultSort.key, resultTableRows]);

  const selectedResultRow = useMemo(
    () => resultTableRows.find((row) => row.id === selectedResultRowId) ?? null,
    [resultTableRows, selectedResultRowId],
  );

  const selectedResultCategory = selectedResultRow?.sourceCategory;
  const selectedCategoryPoint = selectedResultCategory
    ? activeData.byKontoMap6.find(
        (point) => point.name === selectedResultCategory,
      )
    : null;

  const selectedCategoryShare =
    selectedCategoryPoint && costCompositionTotal > 0
      ? (Math.abs(selectedCategoryPoint.Belob) / costCompositionTotal) * 100
      : null;

  const topAnsvarPreview = activeData.topAnsvar.slice(0, 3);
  const topFormaalPreview = activeData.topFormaal.slice(0, 3);

  const lineResultRows = useMemo(
    () => resultTableRows.filter((row) => row.variant === 'line'),
    [resultTableRows],
  );

  const totalAbsLineVariance = useMemo(
    () => lineResultRows.reduce((sum, row) => sum + Math.abs(row.diff), 0),
    [lineResultRows],
  );

  const varianceRankByRowId = useMemo(() => {
    const rankedRows = [...lineResultRows].sort(
      (left, right) => Math.abs(right.diff) - Math.abs(left.diff),
    );
    return new Map(rankedRows.map((row, index) => [row.id, index + 1]));
  }, [lineResultRows]);

  const selectedVarianceImpactPct = useMemo(() => {
    if (
      !selectedResultRow ||
      selectedResultRow.variant !== 'line' ||
      totalAbsLineVariance === 0
    ) {
      return null;
    }

    return (Math.abs(selectedResultRow.diff) / totalAbsLineVariance) * 100;
  }, [selectedResultRow, totalAbsLineVariance]);

  const selectedVarianceRank =
    selectedResultRow?.variant === 'line'
      ? (varianceRankByRowId.get(selectedResultRow.id) ?? null)
      : null;

  const selectedBudgetPrecision = selectedResultRow
    ? Math.max(0, 100 - Math.abs(selectedResultRow.diffPct))
    : null;

  const netPeriodDelta = activeData.kpis.belob - activeData.kpis.budgBelob;

  const selectedContributionToNetDelta = useMemo(() => {
    if (!selectedResultRow || netPeriodDelta === 0) {
      return null;
    }

    return (selectedResultRow.diff / netPeriodDelta) * 100;
  }, [netPeriodDelta, selectedResultRow]);

  const monthlyPressureSummary = useMemo(() => {
    if (monthSeries.length === 0) {
      return null;
    }

    const monthlyVariance = monthSeries.map((point) => ({
      monthLabel: point.monthLabel,
      delta: point.Belob - point.BudgBelob,
    }));

    const monthsBetterThanBudget = monthlyVariance.filter(
      (point) => point.delta > 0,
    ).length;
    const monthsWorseThanBudget = monthlyVariance.filter(
      (point) => point.delta < 0,
    ).length;

    const bestMonth = monthlyVariance.reduce((best, current) =>
      current.delta > best.delta ? current : best,
    );
    const worstMonth = monthlyVariance.reduce((worst, current) =>
      current.delta < worst.delta ? current : worst,
    );

    return {
      monthsBetterThanBudget,
      monthsWorseThanBudget,
      bestMonth,
      worstMonth,
    };
  }, [monthSeries]);

  const closeResultInsightPanel = useCallback(() => {
    setSelectedResultRowId(null);
    lastResultTriggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!selectedResultRowId) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeResultInsightPanel();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [closeResultInsightPanel, selectedResultRowId]);

  const currencyScale = useMemo(
    () =>
      getScale(
        monthSeries.flatMap((point) => [point.Belob, point.BudgBelob]),
        'kr.',
      ),
    [monthSeries],
  );

  const budgetDelta = activeData.kpis.belob - activeData.kpis.budgBelob;
  const budgetDeltaType = budgetDelta >= 0 ? 'increase' : 'decrease';
  const selectedRangeIndex = rangeOptions.indexOf(selectedRange);

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

    const clickTarget =
      chartRoot.querySelector('.recharts-wrapper') ??
      chartRoot.querySelector('.recharts-surface');

    if (!(clickTarget instanceof Element)) {
      return;
    }

    skipProgrammaticCommitKindRef.current = kind;
    clickTarget.dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true }),
    );

    queueMicrotask(() => {
      if (skipProgrammaticCommitKindRef.current === kind) {
        skipProgrammaticCommitKindRef.current = null;
      }
    });
  }, []);

  useEffect(() => {
    const previousKind = previousSelectionKindRef.current;
    const currentKind = selection?.kind ?? null;

    if (previousKind && previousKind !== currentKind) {
      clearChartInternalSelection(previousKind);
    }

    previousSelectionKindRef.current = currentKind;
  }, [clearChartInternalSelection, selection?.kind]);

  const updateSelection = useCallback(
    (kind: Selection['kind'], name: string) => {
      setSelection((previous) => {
        if (previous?.kind === kind && previous.name === name) {
          return previous;
        }
        return { kind, name };
      });
    },
    [],
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

  const monthlyTrendTooltip = createChartSelectionTooltip(
    'Månedstrend',
    stageHoverCandidate,
  );

  const budgetVsRealizedTooltip = createChartSelectionTooltip(
    'Budget vs. Realiseret',
    stageHoverCandidate,
  );

  const topAnsvarTooltip = createChartSelectionTooltip(
    'Ansvar',
    stageHoverCandidate,
  );

  const topFormaalTooltip = createChartSelectionTooltip(
    'Formål',
    stageHoverCandidate,
  );

  const selectionAwareDonutTooltip =
    createDonutSelectionTooltip(stageHoverCandidate);

  // The selection state is intentionally kept in the page root so every chart can
  // react to the same user focus while the summary panel remains in sync.
  return (
    <div className='dd-root px-4 py-6 sm:px-6 lg:px-10'>
      <main
        className={`mx-auto w-full max-w-[1240px] space-y-6 ${
          isLoading ? 'pointer-events-none' : ''
        }`}
      >
        <section className='dd-grid-enter grid gap-6 items-start'>
          <div className='space-y-2 pt-2'>
            <p className='font-body text-[0.7rem] uppercase tracking-[0.14em] text-tremor-content-subtle'>
              DataDein Prototypen
            </p>
            <h1 className='font-display text-3xl font-semibold tracking-[-0.02em] text-tremor-content-strong sm:text-4xl'>
              Vask Af Data
            </h1>
            <Subtitle className='max-w-2xl font-body text-dd-body text-tremor-content-emphasis'>
              Overblik over forbrug, budgetudvikling og fokusenheder baseret på
              reelle regnskabsdata.
            </Subtitle>
          </div>

          <Card className='dd-grid-enter flex gap-4'>
            <div>
              <Text className='dd-section-header mb-0'>
                Rapporteringsperiode
              </Text>
              {activeData.generatedAt ? (
                <Text className='text-sm mt-0 text-tremor-content-subtle'>
                  Genereret{' '}
                  {activeData.generatedAt.replace('T', ' ').substring(0, 16)}{' '}
                  UTC
                </Text>
              ) : null}
              <div className='flex flex-row  gap-4'>
                <TabGroup
                  className='w-[max-content]'
                  index={selectedRangeIndex}
                  onIndexChange={(index) =>
                    handleRangeChange(rangeOptions[index] ?? selectedRange)
                  }
                >
                  <TabList variant='solid'>
                    {rangeOptions.map((range) => (
                      <Tab key={range}>{formatRangeLabel(range)}</Tab>
                    ))}
                  </TabList>
                </TabGroup>
                <Badge
                  className='my-1 w-30'
                  color={isLoading ? 'amber' : 'emerald'}
                >
                  {isLoading
                    ? 'Indlæser data...'
                    : `${formatRangeLabel(selectedRange, 'adjective')} data indlæst`}
                </Badge>
              </div>
            </div>

            {/* <Divider className='my-5' /> */}

            <div className='space-y-3 flex-1'>
              {selection ? (
                // Keep a compact “current focus” state in the summary card so the user
                // can see which chart element was selected without losing context.
                <div className='rounded-tremor-default border border-tremor-border bg-tremor-background-muted p-6 content-between flex'>
                  <div className='flex-1'>
                    <Text className='font-body text-dd-card-label uppercase m-0 text-tremor-content-subtle'>
                      Valgt fokus
                    </Text>
                    <p className='mt-1 text-sm text-tremor-content-emphasis'>
                      <span className='font-body text-dd-card-label uppercase text-tremor-content-subtle'>
                        {selection.kind}
                      </span>{' '}
                      <span className='font-semibold text-tremor-content-strong'>
                        {selection.name}
                      </span>
                    </p>
                  </div>
                  <Button
                    className='h-8'
                    size='xs'
                    variant='secondary'
                    onClick={() => setSelection(null)}
                  >
                    Ryd valg
                  </Button>
                </div>
              ) : null}

              {error ? (
                <p className='rounded-tremor-default border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700'>
                  {error}
                </p>
              ) : null}
            </div>
          </Card>
        </section>

        <Grid
          numItems={1}
          numItemsSm={2}
          numItemsLg={4}
          className='gap-6 items-stretch'
        >
          {/* KPI cards are intentionally lightweight and summary-focused; they give
              the user a quick signal before they drill into the detailed charts. */}
          <FlipCard
            isLoading={isLoading}
            isInitialLoad={isInitialLoad}
            loadToken={loadToken}
            minDelay={MIN_LOAD_DELAY}
            cardId='kpi-realized'
            onBackfaceReady={handleCardBackfaceReady}
          >
            <Card className='dd-grid-enter h-full'>
              <Flex
                flexDirection='col'
                alignItems='start'
                justifyContent='between'
                className='h-full'
              >
                <Text className='dd-section-header'>
                  Samlet beløb (Realiseret)
                </Text>

                <Metric className='m-0'>
                  {(() => {
                    const { value, unit } = formatCompact(
                      activeData.kpis.belob,
                      {
                        scale: currencyScale,
                        digits: 2,
                      },
                    );
                    return (
                      <div className='flex items-baseline gap-1'>
                        <span className='text-datadein-marine'>{value}</span>
                        <span className='font-body text-xl font-semibold text-tremor-content-subtle'>
                          {unit}
                        </span>
                      </div>
                    );
                  })()}
                </Metric>
                <SparkAreaChart
                  data={monthlyChartSeries}
                  index='monthLabel'
                  categories={['Beløb']}
                  colors={['datadein-marine']}
                  className='dd-chart-color-transition h-8 w-full'
                />
                <BadgeDelta
                  className='mt-4 '
                  deltaType={budgetDeltaType}
                  isIncreasePositive
                >
                  {formatCurrency(Math.abs(budgetDelta))} ift. budget
                </BadgeDelta>
              </Flex>
            </Card>
          </FlipCard>

          <FlipCard
            isLoading={isLoading}
            isInitialLoad={isInitialLoad}
            loadToken={loadToken}
            minDelay={MIN_LOAD_DELAY}
            cardId='kpi-budget'
            onBackfaceReady={handleCardBackfaceReady}
          >
            <Card className='dd-grid-enter h-full'>
              <Flex
                flexDirection='col'
                alignItems='start'
                justifyContent='between'
                className='h-full'
              >
                <Text className='dd-section-header'>Samlet budget</Text>

                <Metric className='m-0'>
                  {(() => {
                    const { value, unit } = formatCompact(
                      activeData.kpis.budgBelob,
                      {
                        scale: currencyScale,
                        digits: 2,
                      },
                    );
                    return (
                      <div className='flex items-baseline gap-1'>
                        <span className='text-datadein-marine'>{value}</span>
                        <span className='font-body text-xl font-semibold text-tremor-content-subtle'>
                          {unit}
                        </span>
                      </div>
                    );
                  })()}
                </Metric>
                <SparkAreaChart
                  data={monthlyChartSeries}
                  index='monthLabel'
                  categories={['Budgetbeløb']}
                  colors={['datadein-energi']}
                  className='dd-chart-color-transition h-8 w-full'
                />
                <Text className='font-body text-dd-body mt-4 text-tremor-content-subtle'>
                  Finansiel baseline for periode
                </Text>
              </Flex>
            </Card>
          </FlipCard>

          <FlipCard
            isLoading={isLoading}
            isInitialLoad={isInitialLoad}
            loadToken={loadToken}
            minDelay={MIN_LOAD_DELAY}
            cardId='kpi-ae'
            onBackfaceReady={handleCardBackfaceReady}
          >
            <Card className='dd-grid-enter h-full'>
              <Flex
                flexDirection='col'
                alignItems='start'
                justifyContent='between'
                className='h-full'
              >
                <div>
                  <Text className='dd-section-header'>ÅE (Årsværk)</Text>
                  <Metric className='mt-2 text-datadein-marine'>
                    {formatNumber(activeData.kpis.ae)}
                  </Metric>
                </div>
                <Text className='font-body text-dd-body mt-4 text-tremor-content-subtle'>
                  Budgetteret ÅE: {formatNumber(activeData.kpis.budgAe)}
                </Text>
              </Flex>
            </Card>
          </FlipCard>

          <FlipCard
            isLoading={isLoading}
            isInitialLoad={isInitialLoad}
            loadToken={loadToken}
            minDelay={MIN_LOAD_DELAY}
            cardId='kpi-timer'
            onBackfaceReady={handleCardBackfaceReady}
          >
            <Card className='dd-grid-enter h-full'>
              <Flex
                flexDirection='col'
                alignItems='start'
                justifyContent='between'
                className='h-full'
              >
                <div>
                  <Text className='dd-section-header'>Timer / Elever</Text>
                  <Metric className='mt-2 text-datadein-marine'>
                    {formatNumber(activeData.kpis.timer)}
                  </Metric>
                </div>
                <Text className='font-body text-dd-body mt-4 text-tremor-content-subtle'>
                  Elever i periode: {formatNumber(activeData.kpis.elever)}
                </Text>
              </Flex>
            </Card>
          </FlipCard>
        </Grid>

        <FlipCard
          isLoading={isLoading}
          isInitialLoad={isInitialLoad}
          loadToken={loadToken}
          minDelay={MIN_LOAD_DELAY}
          cardId='result-table'
          onBackfaceReady={handleCardBackfaceReady}
        >
          <Card className='h-full'>
            <Title className='dd-section-header font-bold'>
              Resultatopgørelse
            </Title>
            <Text className='font-body text-dd-body text-tremor-content-subtle'>
              Realiseret vs. budget pr. regnskabspost for den valgte periode
            </Text>
            <div className='mt-5'>
              <div className='overflow-x-auto'>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell>
                        <button
                          type='button'
                          className={`dd-table-header inline-flex items-center gap-1.5 appearance-none border-0 bg-transparent p-0 text-left shadow-none outline-none ring-0 transition-colors`}
                          onClick={() => handleResultSort('default')}
                          aria-label='Nulstil sortering til standardrækkefølge'
                        >
                          Regnskabspost
                        </button>
                      </TableHeaderCell>
                      <TableHeaderCell className='text-right'>
                        <button
                          type='button'
                          className={`dd-table-header inline-flex items-center gap-1.5 appearance-none border-0 bg-transparent p-0 shadow-none outline-none ring-0 transition-colors`}
                          onClick={() => handleResultSort('realized')}
                          aria-label='Sorter efter realiseret'
                        >
                          Realiseret
                          <SortIndicatorIcon
                            sortKey='realized'
                            activeSortKey={resultSort.key}
                            direction={resultSort.direction}
                          />
                        </button>
                      </TableHeaderCell>
                      <TableHeaderCell className='text-right'>
                        <button
                          type='button'
                          className={`dd-table-header inline-flex items-center gap-1.5 appearance-none border-0 bg-transparent p-0 shadow-none outline-none ring-0 transition-colors`}
                          onClick={() => handleResultSort('budget')}
                          aria-label='Sorter efter budget'
                        >
                          Budget
                          <SortIndicatorIcon
                            sortKey='budget'
                            activeSortKey={resultSort.key}
                            direction={resultSort.direction}
                          />
                        </button>
                      </TableHeaderCell>
                      <TableHeaderCell className='text-right'>
                        <button
                          type='button'
                          className={`dd-table-header inline-flex items-center gap-1.5 appearance-none border-0 bg-transparent p-0 shadow-none outline-none ring-0 transition-colors`}
                          onClick={() => handleResultSort('diff')}
                          aria-label='Sorter efter afvigelse'
                        >
                          Afvigelse
                          <SortIndicatorIcon
                            sortKey='diff'
                            activeSortKey={resultSort.key}
                            direction={resultSort.direction}
                          />
                        </button>
                      </TableHeaderCell>
                      <TableHeaderCell className='text-right'>
                        <button
                          type='button'
                          className={`dd-table-header inline-flex items-center gap-1.5 appearance-none border-0 bg-transparent p-0 shadow-none outline-none ring-0 transition-colors`}
                          onClick={() => handleResultSort('diffPct')}
                          aria-label='Sorter efter afvigelse i procent'
                        >
                          Afvigelse %
                          <SortIndicatorIcon
                            sortKey='diffPct'
                            activeSortKey={resultSort.key}
                            direction={resultSort.direction}
                          />
                        </button>
                      </TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sortedResultTableRows.map((row) => {
                      const isSelected = row.id === selectedResultRow?.id;
                      const isHovered = row.id === hoveredResultRowId;

                      return [
                        <TableRow
                          key={row.id}
                          className={`cursor-pointer transition-colors ${
                            row.variant === 'total'
                              ? 'border-t-2 border-tremor-border'
                              : row.variant === 'subtotal'
                                ? 'border-t border-tremor-border bg-tremor-background-muted'
                                : ''
                          } ${
                            isSelected
                              ? 'bg-tremor-background-muted'
                              : isHovered
                                ? 'bg-slate-50'
                                : ''
                          }`}
                          onMouseEnter={() => setHoveredResultRowId(row.id)}
                          onMouseLeave={() => setHoveredResultRowId(null)}
                          onClick={(event) => {
                            lastResultTriggerRef.current =
                              event.currentTarget as HTMLElement;
                            const nextId =
                              selectedResultRowId === row.id ? null : row.id;
                            setSelectedResultRowId(nextId);
                            if (nextId && row.sourceCategory) {
                              updateSelection('KontoMap6', row.sourceCategory);
                            }
                          }}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              lastResultTriggerRef.current =
                                event.currentTarget as HTMLElement;
                              const nextId =
                                selectedResultRowId === row.id ? null : row.id;
                              setSelectedResultRowId(nextId);
                              if (nextId && row.sourceCategory) {
                                updateSelection(
                                  'KontoMap6',
                                  row.sourceCategory,
                                );
                              }
                            }
                          }}
                          tabIndex={0}
                          aria-expanded={isSelected}
                          aria-label={`Vis indsigt for ${row.name}`}
                        >
                          <TableCell
                            className={
                              row.variant === 'subtotal' ||
                              row.variant === 'total'
                                ? 'font-semibold text-tremor-content-strong'
                                : 'font-medium text-tremor-content-strong'
                            }
                          >
                            {row.name}
                          </TableCell>
                          <TableCell
                            className={`text-right ${
                              row.variant === 'subtotal' ||
                              row.variant === 'total'
                                ? 'font-semibold text-tremor-content-strong'
                                : ''
                            }`}
                          >
                            {formatCurrency(row.realized)}
                          </TableCell>
                          <TableCell
                            className={`text-right ${
                              row.variant === 'subtotal' ||
                              row.variant === 'total'
                                ? 'font-semibold text-tremor-content-strong'
                                : ''
                            }`}
                          >
                            {formatCurrency(row.budget)}
                          </TableCell>
                          <TableCell
                            className={`text-right ${
                              row.variant === 'subtotal' ||
                              row.variant === 'total'
                                ? 'font-semibold text-tremor-content-strong'
                                : ''
                            }`}
                          >
                            {formatCurrency(row.diff)}
                          </TableCell>
                          <TableCell className='text-right'>
                            <BadgeDelta
                              deltaType={
                                row.diff >= 0 ? 'increase' : 'decrease'
                              }
                              isIncreasePositive
                            >
                              {row.diffPct >= 0 ? '+' : ''}
                              {row.diffPct.toFixed(1)}%
                            </BadgeDelta>
                          </TableCell>
                        </TableRow>,
                        isSelected ? (
                          <TableRow
                            key={`${row.id}-context`}
                            className='dd-row-context-enter'
                          >
                            <TableCell
                              colSpan={5}
                              className='overflow-visible p-0'
                            >
                              <div className='relative mt-1 overflow-visible border-l-4 border-l-datadein-marine bg-tremor-background-muted px-4 pb-4 pt-4'>
                                <div className='absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2'>
                                  <button
                                    type='button'
                                    className='dd-context-close-btn relative z-10 inline-flex h-8 w-8 items-center justify-center rounded-full border border-transparent bg-white text-datadein-sten-200 transition-colors hover:text-datadein-marine focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-datadein-marine/30'
                                    onClick={closeResultInsightPanel}
                                    aria-label='Luk kontekst'
                                  >
                                    <ChevronUpIcon className='h-4 w-4' />
                                  </button>
                                </div>

                                <Grid
                                  numItems={1}
                                  numItemsLg={2}
                                  className='mt-4 gap-3'
                                >
                                  <Card className='p-3'>
                                    <Text className='dd-section-header m-0'>
                                      Afvigelsesformel
                                    </Text>
                                    <Text className='mt-2 text-tremor-content-emphasis'>
                                      {formatCurrency(
                                        selectedResultRow.realized,
                                      )}{' '}
                                      -{' '}
                                      {formatCurrency(selectedResultRow.budget)}{' '}
                                      ={' '}
                                      <span className='font-semibold text-tremor-content-strong'>
                                        {formatCurrency(selectedResultRow.diff)}
                                      </span>
                                    </Text>
                                    <Text className='mt-1 text-sm text-tremor-content-subtle'>
                                      Afvigelse:{' '}
                                      {selectedResultRow.diffPct.toFixed(1)}%
                                    </Text>
                                  </Card>

                                  <Card className='p-3'>
                                    <Text className='dd-section-header m-0'>
                                      Nøgletal
                                    </Text>
                                    <div className='mt-2 space-y-1'>
                                      {selectedVarianceImpactPct !== null ? (
                                        <Text className='text-sm text-tremor-content-emphasis'>
                                          Andel af total afvigelse:{' '}
                                          {selectedVarianceImpactPct.toFixed(1)}
                                          %
                                        </Text>
                                      ) : (
                                        <Text className='text-sm text-tremor-content-subtle'>
                                          Andel af total afvigelse: ikke
                                          relevant for subtotal/total
                                        </Text>
                                      )}
                                      {selectedVarianceRank !== null ? (
                                        <Text className='text-sm text-tremor-content-emphasis'>
                                          Variansrang blandt linjeposter: #
                                          {selectedVarianceRank}
                                        </Text>
                                      ) : null}
                                      {selectedBudgetPrecision !== null ? (
                                        <Text className='text-sm text-tremor-content-emphasis'>
                                          Budgetpræcision:{' '}
                                          {selectedBudgetPrecision.toFixed(1)}%
                                        </Text>
                                      ) : null}
                                      {selectedContributionToNetDelta !==
                                      null ? (
                                        <Text className='text-sm text-tremor-content-emphasis'>
                                          Bidrag til periodens netdelta:{' '}
                                          {selectedContributionToNetDelta.toFixed(
                                            1,
                                          )}
                                          %
                                        </Text>
                                      ) : (
                                        <Text className='text-sm text-tremor-content-subtle'>
                                          Bidrag til periodens netdelta: ikke
                                          beregnelig (netdelta = 0)
                                        </Text>
                                      )}
                                    </div>
                                  </Card>

                                  <Card className='p-3'>
                                    <Text className='dd-section-header m-0'>
                                      Kategorikontekst
                                    </Text>
                                    {selectedCategoryPoint ? (
                                      <>
                                        <Text className='mt-2 text-tremor-content-emphasis'>
                                          Realt beløb i kategori:{' '}
                                          {formatCurrency(
                                            selectedCategoryPoint.Belob,
                                          )}
                                        </Text>
                                        {selectedCategoryShare !== null ? (
                                          <Text className='mt-1 text-sm text-tremor-content-subtle'>
                                            Andel af samlede omkostninger:{' '}
                                            {selectedCategoryShare.toFixed(1)}%
                                          </Text>
                                        ) : null}
                                      </>
                                    ) : (
                                      <Text className='mt-2 text-sm text-tremor-content-subtle'>
                                        Denne linje er en beregnet
                                        subtotal/total uden direkte
                                        kategori-match.
                                      </Text>
                                    )}
                                  </Card>

                                  <Card className='p-3'>
                                    <Text className='dd-section-header m-0'>
                                      Periodetryk
                                    </Text>
                                    {monthlyPressureSummary ? (
                                      <div className='mt-2 space-y-1'>
                                        <Text className='text-sm text-datadein-marine'>
                                          Bedre end budget:{' '}
                                          {
                                            monthlyPressureSummary.monthsBetterThanBudget
                                          }{' '}
                                          mdr.
                                        </Text>
                                        <Text className='text-sm text-datadein-energi'>
                                          Dårligere end budget:{' '}
                                          {
                                            monthlyPressureSummary.monthsWorseThanBudget
                                          }{' '}
                                          mdr.
                                        </Text>
                                        <Text className='text-sm text-tremor-content-subtle'>
                                          Bedste måned:{' '}
                                          {
                                            monthlyPressureSummary.bestMonth
                                              .monthLabel
                                          }{' '}
                                          (
                                          {formatCurrency(
                                            monthlyPressureSummary.bestMonth
                                              .delta,
                                          )}
                                          )
                                        </Text>
                                        <Text className='text-sm text-tremor-content-subtle'>
                                          Værste måned:{' '}
                                          {
                                            monthlyPressureSummary.worstMonth
                                              .monthLabel
                                          }{' '}
                                          (
                                          {formatCurrency(
                                            monthlyPressureSummary.worstMonth
                                              .delta,
                                          )}
                                          )
                                        </Text>
                                      </div>
                                    ) : (
                                      <Text className='mt-2 text-sm text-tremor-content-subtle'>
                                        Ingen månedlige datapunkter tilgængelige
                                        for periodetryk.
                                      </Text>
                                    )}
                                  </Card>

                                  <Card className='p-3 lg:col-span-2'>
                                    <Text className='dd-section-header m-0'>
                                      Top bidragydere i perioden
                                    </Text>
                                    <div className='mt-2 space-y-2'>
                                      {topAnsvarPreview.map((point) => (
                                        <Flex
                                          key={`ansvar-${point.name}`}
                                          justifyContent='between'
                                        >
                                          <Text className='text-sm text-tremor-content-emphasis'>
                                            {point.name}
                                          </Text>
                                          <Text className='text-sm font-semibold text-tremor-content-strong'>
                                            {formatCurrency(point.Belob)}
                                          </Text>
                                        </Flex>
                                      ))}
                                      {topFormaalPreview
                                        .slice(0, 1)
                                        .map((point) => (
                                          <Text
                                            key={`formaal-${point.name}`}
                                            className='text-xs text-tremor-content-subtle'
                                          >
                                            Største formål: {point.name} (
                                            {formatCurrency(point.Belob)})
                                          </Text>
                                        ))}
                                    </div>
                                  </Card>
                                </Grid>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : null,
                      ];
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </Card>
        </FlipCard>

        <Grid numItems={1} numItemsLg={2} className='gap-6 items-stretch'>
          {/* The monthly views should be the first deep-dive: they tell the story of
              trend, variance, and pacing before the user explores grouped dimensions. */}
          <FlipCard
            isLoading={isLoading}
            isInitialLoad={isInitialLoad}
            loadToken={loadToken}
            minDelay={MIN_LOAD_DELAY}
            cardId='monthly'
            onBackfaceReady={handleCardBackfaceReady}
          >
            <Card className='h-full'>
              <Title className='font-display text-dd-panel-title text-tremor-content-strong'>
                Beløbtrend pr. måned
              </Title>
              <Text className='font-body text-dd-body text-tremor-content-subtle'>
                Realiseret forbrug over tid for den valgte periode
              </Text>
              <AreaChart
                ref={setChartRootRef('Månedstrend')}
                className='dd-chart-color-transition mt-5 h-72'
                data={monthlyChartSeries}
                index='monthLabel'
                categories={['Beløb']}
                colors={['datadein-marine']}
                showLegend={false}
                yAxisWidth={48}
                yAxisLabel={currencyScale.label}
                valueFormatter={(v) =>
                  formatCompact(v, {
                    divisor: currencyScale.divisor,
                    digits: 1,
                  }).full
                }
                customTooltip={monthlyTrendTooltip}
                onClick={() => handleChartCommit('Månedstrend')}
                onValueChange={(event) => {
                  const name = getEventName(event);
                  if (name) {
                    updateSelection('Månedstrend', name);
                  }
                }}
                showAnimation
              />
            </Card>
          </FlipCard>

          <FlipCard
            isLoading={isLoading}
            isInitialLoad={isInitialLoad}
            loadToken={loadToken}
            minDelay={MIN_LOAD_DELAY}
            cardId='budget-vs-realized'
            onBackfaceReady={handleCardBackfaceReady}
          >
            <Card className='h-full'>
              <Title className='font-display text-dd-panel-title text-tremor-content-strong'>
                Budget vs. Realiseret
              </Title>
              <Text className='font-body text-dd-body text-tremor-content-subtle'>
                Sammenligning af realiseret beløb og budget pr. måned
              </Text>
              <BarChart
                ref={setChartRootRef('Budget vs. Realiseret')}
                className='dd-chart-color-transition mt-5 h-72'
                data={monthlyChartSeries}
                index='monthLabel'
                categories={['Beløb', 'Budgetbeløb']}
                colors={['datadein-marine', 'datadein-energi']}
                yAxisWidth={48}
                yAxisLabel={currencyScale.label}
                valueFormatter={(v) =>
                  formatCompact(v, {
                    divisor: currencyScale.divisor,
                    digits: 1,
                  }).full
                }
                customTooltip={budgetVsRealizedTooltip}
                onClick={() => handleChartCommit('Budget vs. Realiseret')}
                onValueChange={(event) => {
                  const name = getEventName(event);
                  if (name) {
                    updateSelection('Budget vs. Realiseret', name);
                  }
                }}
                showAnimation
              />
            </Card>
          </FlipCard>
        </Grid>

        <Grid numItems={1} numItemsLg={3} className='gap-6 items-stretch'>
          {/* Drill-down charts stay interactive; selecting a segment updates the shared
              focus state and keeps the dashboard consistent across all views. */}
          <FlipCard
            isLoading={isLoading}
            isInitialLoad={isInitialLoad}
            loadToken={loadToken}
            minDelay={MIN_LOAD_DELAY}
            cardId='top-ansvar'
            onBackfaceReady={handleCardBackfaceReady}
          >
            <Card className='h-full'>
              <Title className='font-display text-dd-panel-title text-tremor-content-strong'>
                Top Ansvarsområder
              </Title>
              <Text className='font-body text-dd-body text-tremor-content-subtle'>
                Klik på en søjle for at vælge et fokuspunkt
              </Text>
              <div
                className='mt-5 h-72'
                onClick={() => handleChartCommit('Ansvar')}
              >
                <BarChart
                  ref={setChartRootRef('Ansvar')}
                  className='dd-chart-color-transition h-full'
                  data={topAnsvarChartSeries}
                  index='name'
                  categories={['Beløb']}
                  colors={['datadein-marine']}
                  layout='horizontal'
                  showXAxis={false}
                  showLegend={false}
                  yAxisLabel={currencyScale.label}
                  yAxisWidth={24}
                  valueFormatter={(v) =>
                    formatCompact(v, {
                      divisor: currencyScale.divisor,
                      digits: 1,
                    }).full
                  }
                  customTooltip={topAnsvarTooltip}
                  onValueChange={(event) => {
                    const name = getEventName(event);
                    if (name) {
                      updateSelection('Ansvar', name);
                    }
                  }}
                />
              </div>
            </Card>
          </FlipCard>

          <FlipCard
            isLoading={isLoading}
            isInitialLoad={isInitialLoad}
            loadToken={loadToken}
            minDelay={MIN_LOAD_DELAY}
            cardId='top-formaal'
            onBackfaceReady={handleCardBackfaceReady}
          >
            <Card className='h-full'>
              <Title className='font-display text-dd-panel-title text-tremor-content-strong'>
                Top Formål
              </Title>
              <Text className='font-body text-dd-body text-tremor-content-subtle'>
                Klik på en søjle for at vælge et fokuspunkt
              </Text>
              <div
                className='mt-5 h-72'
                onClick={() => handleChartCommit('Formål')}
              >
                <BarChart
                  ref={setChartRootRef('Formål')}
                  className='dd-chart-color-transition h-full'
                  data={topFormaalChartSeries}
                  index='name'
                  categories={['Beløb']}
                  colors={['datadein-marine']}
                  layout='horizontal'
                  showXAxis={false}
                  showLegend={false}
                  yAxisLabel={currencyScale.label}
                  yAxisWidth={32}
                  valueFormatter={(v) =>
                    formatCompact(v, {
                      divisor: currencyScale.divisor,
                      digits: 1,
                    }).full
                  }
                  customTooltip={topFormaalTooltip}
                  onValueChange={(event) => {
                    const name = getEventName(event);
                    if (name) {
                      updateSelection('Formål', name);
                    }
                  }}
                />
              </div>
            </Card>
          </FlipCard>

          <FlipCard
            isLoading={isLoading}
            isInitialLoad={isInitialLoad}
            loadToken={loadToken}
            minDelay={MIN_LOAD_DELAY}
            cardId='cost'
            onBackfaceReady={handleCardBackfaceReady}
          >
            <Card className='h-full'>
              <Title className='font-display text-dd-panel-title text-tremor-content-strong'>
                Omkostningsfordeling
              </Title>
              <Text className='font-body text-dd-body text-tremor-content-subtle'>
                Andel af samlede omkostninger (ekskl. indtægter)
              </Text>
              <div className='relative mt-5 h-72'>
                <div
                  className='relative z-10 h-full w-full'
                  onClick={() => handleChartCommit('KontoMap6')}
                >
                  <DonutChart
                    ref={setChartRootRef('KontoMap6')}
                    className='dd-chart-color-transition h-full'
                    data={costCompositionSeries}
                    category='Beløb'
                    index='name'
                    colors={[
                      'datadein-sten',
                      'datadein-hav',
                      'datadein-energi',
                      'datadein-himmel',
                    ]}
                    valueFormatter={(v) =>
                      formatCompact(v, { scale: getScale(v, 'kr.'), digits: 1 })
                        .full
                    }
                    customTooltip={selectionAwareDonutTooltip}
                    showLabel={false}
                    showAnimation
                    onValueChange={(event) => {
                      const name = getEventName(event);
                      if (name) {
                        updateSelection('KontoMap6', name);
                      }
                    }}
                  />
                </div>

                {/* Center Label Overlay (Kept under z-0) */}
                <div className='pointer-events-none absolute inset-0 flex items-center justify-center z-0'>
                  <div className='text-center pt-10'>
                    <div className='dd-section-header'>Totale omkostninger</div>
                    <Metric className='mt-2 flex flex-col items-start'>
                      {(() => {
                        const { value, unit } = formatCompact(
                          costCompositionTotal,
                          {
                            scale: getScale(costCompositionTotal, 'kr.'),
                            digits: 1,
                          },
                        );
                        return (
                          <div className='flex flex-col items-center w-full'>
                            <span className='text-datadein-marine'>
                              {value}
                            </span>
                            <span className='font-body text-xl font-semibold text-tremor-content-subtle'>
                              {unit}
                            </span>
                          </div>
                        );
                      })()}
                    </Metric>
                  </div>
                </div>
              </div>
            </Card>
          </FlipCard>
        </Grid>
      </main>
    </div>
  );
}

export default App;
