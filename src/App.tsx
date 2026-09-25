import { useCallback, useMemo, useState } from 'react';

import { AreaChart, BarChart, DonutChart } from '@tremor/react';

import { FlipCard, MIN_LOAD_DELAY } from './components/FlipCard';
import { KpiCard } from './components/KpiCard';
import {
  ResultTable,
  type ResultRowVariant,
  type ResultTableRow,
} from './components/ResultTable';
import { Badge, BadgeDelta } from './components/ui/badge';
import { Button } from './components/ui/button';
import { Card } from './components/ui/card';
import { Grid } from './components/ui/layout';
import { Tabs, TabsList, TabsTrigger } from './components/ui/tabs';
import { Text, Title } from './components/ui/text';
import {
  useDashboardRangeData,
  type DashboardRangeKey,
} from './hooks/useDashboardRangeData';
import { useFlipCardLoadCycle } from './hooks/useFlipCardLoadCycle';
import {
  createChartSelectionTooltips,
  useChartSelection,
} from './utils/chartSelection';
import {
  formatCompact,
  formatCurrency,
  formatMonthLabel,
  formatNumber,
  getEventName,
  getScale,
} from './utils/format';
import { formatRangeLabel } from './utils/labels';

// Keep the range switcher centralized and explicit. The app uses the selected
// period as the source of truth for both data fetching and chart state.
const rangeOptions: DashboardRangeKey[] = ['1Y', '3Y', 'ALL'];
const TOTAL_FLIP_CARDS = 10;

const isDashboardRangeKey = (value: string): value is DashboardRangeKey =>
  rangeOptions.includes(value as DashboardRangeKey);

const renderKpiMetric = (value: string, unit?: string) => (
  <div className='flex items-baseline gap-1'>
    <span className='font-display text-4xl leading-none tracking-tight text-datadein-marine'>
      {value}
    </span>
    {unit ? (
      <span className='font-body text-dd-body text-tremor-content-subtle'>
        {unit}
      </span>
    ) : null}
  </div>
);

function App() {
  const [selectedRange, setSelectedRange] = useState<DashboardRangeKey>('1Y');
  const {
    selection,
    setSelection,
    setChartRootRef,
    updateSelection,
    stageHoverCandidate,
    handleChartCommit,
    resetPreviousSelection,
  } = useChartSelection();

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
      insight: null,
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

  const resultTableRows = useMemo(() => {
    const lineRows = [
      indtaegterRow,
      personaleRow,
      driftRow,
      afskrivningerRow,
      finansielleRow,
    ];
    const totalAbsLineVariance = lineRows.reduce(
      (sum, row) => sum + Math.abs(row.diff),
      0,
    );
    const rankedRows = [...lineRows].sort(
      (left, right) => Math.abs(right.diff) - Math.abs(left.diff),
    );
    const rankById = new Map(
      rankedRows.map((row, index) => [row.id, index + 1]),
    );
    const netDelta = activeData.kpis.belob - activeData.kpis.budgBelob;

    return [
      indtaegterRow,
      personaleRow,
      driftRow,
      driftsresultatRow,
      afskrivningerRow,
      resultatFoerFinansielleRow,
      finansielleRow,
      resultatRow,
    ].map((row) => {
      if (row.variant !== 'line') {
        return row;
      }

      const categoryPoint = row.sourceCategory
        ? activeData.byKontoMap6.find(
            (point) => point.name === row.sourceCategory,
          )
        : null;
      const categoryShare =
        categoryPoint && costCompositionTotal > 0
          ? (Math.abs(categoryPoint.Belob) / costCompositionTotal) * 100
          : null;

      const varianceShare =
        totalAbsLineVariance > 0
          ? (Math.abs(row.diff) / totalAbsLineVariance) * 100
          : null;

      const contributionToNetDelta =
        netDelta !== 0 ? (row.diff / netDelta) * 100 : null;

      const summary =
        row.diff >= 0
          ? `${row.name} er ${Math.abs(row.diffPct).toFixed(1)}% over budget.`
          : `${row.name} er ${Math.abs(row.diffPct).toFixed(1)}% under budget.`;

      return {
        ...row,
        insight: {
          varianceShare,
          varianceRank: rankById.get(row.id) ?? null,
          budgetPrecision: Math.max(0, 100 - Math.abs(row.diffPct)),
          contributionToNetDelta,
          categoryShare,
          summary,
        },
      };
    });
  }, [
    activeData.byKontoMap6,
    activeData.kpis.belob,
    activeData.kpis.budgBelob,
    afskrivningerRow,
    costCompositionTotal,
    driftRow,
    driftsresultatRow,
    finansielleRow,
    indtaegterRow,
    personaleRow,
    resultatFoerFinansielleRow,
    resultatRow,
  ]);

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
  const handleRangeValueChange = useCallback(
    (value: string) => {
      if (!isDashboardRangeKey(value)) {
        return;
      }

      handleRangeChange(value);
    },
    [handleRangeChange],
  );

  const chartTooltips = useMemo(
    () => createChartSelectionTooltips(stageHoverCandidate),
    [stageHoverCandidate],
  );

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
          <Card className='dd-grid-enter flex flex-col gap-4 lg:flex-row lg:items-stretch'>
            <div className='flex h-full flex-col gap-2 lg:min-w-[20rem] lg:flex-none'>
              <div>
                <Title className='dd-section-header m-0'>
                  Rapporteringsperiode
                </Title>
                {activeData.generatedAt ? (
                  <Text className='text-sm mt-0 text-tremor-content-subtle'>
                    Genereret{' '}
                    {activeData.generatedAt.replace('T', ' ').substring(0, 16)}{' '}
                    UTC
                  </Text>
                ) : null}
              </div>
              <div className='flex flex-row gap-4'>
                <Tabs
                  className='w-max'
                  value={selectedRange}
                  onValueChange={handleRangeValueChange}
                >
                  <TabsList variant='solid' className='w-fit'>
                    {rangeOptions.map((range) => (
                      <TabsTrigger key={range} value={range}>
                        {formatRangeLabel(range)}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
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

            <div className='flex min-h-0 flex-1 flex-col gap-3'>
              {selection ? (
                // Keep a compact “current focus” state in the summary card so the user
                // can see which chart element was selected without losing context.
                <div className='flex h-full min-h-0 w-full flex-1 self-stretch bg-tremor-background-muted p-6'>
                  <div className='flex-1'>
                    <Title className='dd-section-header m-0'>Valgt fokus</Title>
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
                    onClick={() => {
                      resetPreviousSelection();
                      setSelection(null);
                    }}
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
            <KpiCard
              title='Samlet beløb (Realiseret)'
              metric={(() => {
                const { value, unit } = formatCompact(activeData.kpis.belob, {
                  scale: currencyScale,
                  digits: 2,
                });

                return renderKpiMetric(value, unit);
              })()}
              sparkChartProps={{
                data: monthlyChartSeries,
                index: 'monthLabel',
                categories: ['Beløb'],
                colors: ['datadein-marine'],
                className: 'dd-chart-color-transition h-12 w-full',
              }}
              footer={
                <BadgeDelta
                  className='m-0 font-body text-dd-body text-tremor-content-subtle'
                  deltaType={budgetDeltaType}
                  isIncreasePositive
                >
                  {formatCurrency(Math.abs(budgetDelta))} ift. budget
                </BadgeDelta>
              }
            />
          </FlipCard>

          <FlipCard
            isLoading={isLoading}
            isInitialLoad={isInitialLoad}
            loadToken={loadToken}
            minDelay={MIN_LOAD_DELAY}
            cardId='kpi-budget'
            onBackfaceReady={handleCardBackfaceReady}
          >
            <KpiCard
              title='Samlet budget'
              metric={(() => {
                const { value, unit } = formatCompact(
                  activeData.kpis.budgBelob,
                  {
                    scale: currencyScale,
                    digits: 2,
                  },
                );

                return renderKpiMetric(value, unit);
              })()}
              sparkChartProps={{
                data: monthlyChartSeries,
                index: 'monthLabel',
                categories: ['Budgetbeløb'],
                colors: ['datadein-energi'],
                className: 'dd-chart-color-transition h-12 w-full',
              }}
              footer='Finansiel grundlinje'
            />
          </FlipCard>

          <FlipCard
            isLoading={isLoading}
            isInitialLoad={isInitialLoad}
            loadToken={loadToken}
            minDelay={MIN_LOAD_DELAY}
            cardId='kpi-ae'
            onBackfaceReady={handleCardBackfaceReady}
          >
            <KpiCard
              title='ÅE (Årsværk)'
              metric={renderKpiMetric(formatNumber(activeData.kpis.ae))}
              footer={`Budgetteret ÅE: ${formatNumber(activeData.kpis.budgAe)}`}
            />
          </FlipCard>

          <FlipCard
            isLoading={isLoading}
            isInitialLoad={isInitialLoad}
            loadToken={loadToken}
            minDelay={MIN_LOAD_DELAY}
            cardId='kpi-timer'
            onBackfaceReady={handleCardBackfaceReady}
          >
            <KpiCard
              title='Timer / Elever'
              metric={renderKpiMetric(formatNumber(activeData.kpis.timer))}
              footer={`Elever i periode: ${formatNumber(activeData.kpis.elever)}`}
            />
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
          <ResultTable
            rows={resultTableRows}
            insightData={{
              byKontoMap6: activeData.byKontoMap6,
              topAnsvar: activeData.topAnsvar,
              topFormaal: activeData.topFormaal,
              monthly: monthSeries.map((point) => ({
                monthLabel: point.monthLabel,
                Belob: point.Belob,
                BudgBelob: point.BudgBelob,
              })),
              netPeriodDelta: activeData.kpis.belob - activeData.kpis.budgBelob,
              costCompositionTotal,
            }}
            onRowSelect={(category) => {
              if (category) {
                updateSelection('KontoMap6', category);
              }
            }}
          />
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
              <Title className='dd-section-header'>Beløbtrend pr. måned</Title>
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
                customTooltip={chartTooltips.monthlyTrend}
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
              <Title className='dd-section-header'>Budget vs. Realiseret</Title>
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
                customTooltip={chartTooltips.budgetVsRealized}
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
              <Title className='dd-section-header'>Top Ansvarsområder</Title>
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
                  customTooltip={chartTooltips.topAnsvar}
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
              <Title className='dd-section-header'>Top Formål</Title>
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
                  customTooltip={chartTooltips.topFormaal}
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
              <Title className='dd-section-header'>Omkostningsfordeling</Title>
              <Text className='font-body text-dd-body text-tremor-content-subtle'>
                Andel af samlede omkostninger (ekskl. indtægter)
              </Text>
              <div className='relative mt-5 h-72'>
                <div
                  ref={setChartRootRef('KontoMap6')}
                  className='relative z-10 h-full w-full'
                  onClick={() => handleChartCommit('KontoMap6')}
                >
                  <DonutChart
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
                    customTooltip={chartTooltips.donut}
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
                  <div className='text-center'>
                    <Text className='text-datadein-marine font-bold text-xl m-0'>
                      Totale omkostninger
                    </Text>
                    <div className='h-12 my-0'>
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
                            <span className='text-datadein-marine text-4xl font-bold'>
                              {value}
                            </span>
                            <span className='text-tremor-content-subtle text-xl font-semibold '>
                              {unit}
                            </span>
                          </div>
                        );
                      })()}
                    </div>
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
