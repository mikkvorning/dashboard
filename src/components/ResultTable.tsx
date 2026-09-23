import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ChevronUpIcon } from './icons/ChevronUpIcon';
import { SortIndicatorIcon } from './icons/SortIndicatorIcon';
import { BadgeDelta } from './ui/badge';
import { Card } from './ui/card';
import { Flex, Grid } from './ui/layout';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderButton,
  TableHeaderCell,
  TableRoot,
  TableRow,
} from './ui/table';
import { Text } from './ui/text';
import { formatCurrency } from '../utils/format';

export type ResultRowVariant = 'line' | 'subtotal' | 'total';

export type ResultTableInsight = {
  varianceShare: number | null;
  varianceRank: number | null;
  budgetPrecision: number | null;
  contributionToNetDelta: number | null;
  categoryShare: number | null;
  summary: string;
};

export type ResultTableRow = {
  id: string;
  name: string;
  realized: number;
  budget: number;
  diff: number;
  diffPct: number;
  variant: ResultRowVariant;
  sourceCategory?: string;
  insight?: ResultTableInsight | null;
};

export type ResultSortKey =
  | 'default'
  | 'realized'
  | 'budget'
  | 'diff'
  | 'diffPct';

type ResultTableColumnKey = 'name' | 'realized' | 'budget' | 'diff' | 'diffPct';

type ResultTableSortableKey = Exclude<ResultSortKey, 'default'>;

type ResultTableColumn = {
  key: ResultTableColumnKey;
  label: string;
  align?: 'left' | 'right';
  sortKey?: ResultTableSortableKey;
  resetSort?: boolean;
  renderValue: (row: ResultTableRow) => string | number | React.ReactNode;
  cellClassName?: (row: ResultTableRow) => string;
};

type ResultTableInsightData = {
  byKontoMap6: Array<{
    name: string;
    Belob: number;
    BudgBelob?: number;
  }>;
  topAnsvar: Array<{
    name: string;
    Belob: number;
  }>;
  topFormaal: Array<{
    name: string;
    Belob: number;
  }>;
  monthly: Array<{
    monthLabel: string;
    Belob: number;
    BudgBelob: number;
  }>;
  netPeriodDelta: number;
  costCompositionTotal: number;
};

type ResultTableProps = {
  rows: ResultTableRow[];
  insightData?: ResultTableInsightData;
  onRowSelect?: (category: string | null) => void;
};

export function ResultTable({
  rows,
  insightData,
  onRowSelect,
}: ResultTableProps) {
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
  const lastResultTriggerRef = useRef<HTMLElement | null>(null);

  const byKontoMap6 = insightData?.byKontoMap6 ?? [];
  const topAnsvar = insightData?.topAnsvar ?? [];
  const topFormaal = insightData?.topFormaal ?? [];
  const monthly = insightData?.monthly ?? [];
  const netPeriodDelta = insightData?.netPeriodDelta ?? 0;

  const resultTableColumns = useMemo<ResultTableColumn[]>(
    () => [
      {
        key: 'name',
        label: 'Regnskabspost',
        align: 'left',
        resetSort: true,
        renderValue: (row) => row.name,
        cellClassName: (row) =>
          row.variant === 'subtotal' || row.variant === 'total'
            ? 'font-semibold text-tremor-content-strong'
            : 'font-medium text-tremor-content-strong',
      },
      {
        key: 'realized',
        label: 'Realiseret',
        align: 'right',
        sortKey: 'realized',
        renderValue: (row) => formatCurrency(row.realized),
        cellClassName: (row) =>
          `text-right ${
            row.variant === 'subtotal' || row.variant === 'total'
              ? 'font-semibold text-tremor-content-strong'
              : ''
          }`,
      },
      {
        key: 'budget',
        label: 'Budget',
        align: 'right',
        sortKey: 'budget',
        renderValue: (row) => formatCurrency(row.budget),
        cellClassName: (row) =>
          `text-right ${
            row.variant === 'subtotal' || row.variant === 'total'
              ? 'font-semibold text-tremor-content-strong'
              : ''
          }`,
      },
      {
        key: 'diff',
        label: 'Afvigelse',
        align: 'right',
        sortKey: 'diff',
        renderValue: (row) => formatCurrency(row.diff),
        cellClassName: (row) =>
          `text-right ${
            row.variant === 'subtotal' || row.variant === 'total'
              ? 'font-semibold text-tremor-content-strong'
              : ''
          }`,
      },
      {
        key: 'diffPct',
        label: 'Afvigelse %',
        align: 'right',
        sortKey: 'diffPct',
        renderValue: (row) => (
          <BadgeDelta
            deltaType={row.diff >= 0 ? 'increase' : 'decrease'}
            isIncreasePositive
          >
            {row.diffPct >= 0 ? '+' : ''}
            {row.diffPct.toFixed(1)}%
          </BadgeDelta>
        ),
        cellClassName: () => 'text-right',
      },
    ],
    [],
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
      return rows;
    }

    const lineRows = rows.filter((row) => row.variant === 'line');
    const nonLineRows = rows.filter((row) => row.variant !== 'line');

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
  }, [resultSort.direction, resultSort.key, rows]);

  const selectedResultRow = useMemo(
    () => rows.find((row) => row.id === selectedResultRowId) ?? null,
    [rows, selectedResultRowId],
  );

  const selectedInsight = selectedResultRow?.insight ?? null;
  const getValueToneClass = (value: number) =>
    value >= 0 ? 'font-bold text-emerald-600' : 'font-bold text-rose-600';
  const selectedCategoryPoint =
    selectedResultRow?.sourceCategory && byKontoMap6.length > 0
      ? byKontoMap6.find(
          (point) => point.name === selectedResultRow.sourceCategory,
        )
      : null;

  const selectedCategoryShare = selectedInsight?.categoryShare ?? null;

  const topAnsvarPreview = topAnsvar.slice(0, 3);
  const topFormaalPreview = topFormaal.slice(0, 3);

  const lineResultRows = useMemo(
    () => rows.filter((row) => row.variant === 'line'),
    [rows],
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

  const selectedVarianceImpactPct =
    selectedInsight?.varianceShare ??
    (selectedResultRow &&
    selectedResultRow.variant === 'line' &&
    totalAbsLineVariance > 0
      ? (Math.abs(selectedResultRow.diff) / totalAbsLineVariance) * 100
      : null);

  const selectedVarianceRank =
    selectedInsight?.varianceRank ??
    (selectedResultRow?.variant === 'line'
      ? (varianceRankByRowId.get(selectedResultRow.id) ?? null)
      : null);

  const selectedBudgetPrecision =
    selectedInsight?.budgetPrecision ??
    (selectedResultRow
      ? Math.max(0, 100 - Math.abs(selectedResultRow.diffPct))
      : null);

  const selectedContributionToNetDelta =
    selectedInsight?.contributionToNetDelta ??
    (selectedResultRow && netPeriodDelta !== 0
      ? (selectedResultRow.diff / netPeriodDelta) * 100
      : null);

  const monthlyPressureSummary = useMemo(() => {
    if (monthly.length === 0) {
      return null;
    }

    const monthlyVariance = monthly.map((point) => ({
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
  }, [monthly]);

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

  return (
    <Card className='h-full'>
      <Text className='dd-section-header'>Resultatopgørelse</Text>
      <Text className='font-body text-dd-body text-tremor-content-subtle'>
        Realiseret vs. budget pr. regnskabspost for den valgte periode
      </Text>
      <div className='mt-5'>
        <TableRoot>
          <Table>
            <TableHead>
              <TableRow>
                {resultTableColumns.map((column) => (
                  <TableHeaderCell
                    key={column.key}
                    className={column.align === 'right' ? 'text-right' : ''}
                  >
                    {column.sortKey || column.resetSort ? (
                      <TableHeaderButton
                        align={column.align === 'right' ? 'right' : 'left'}
                        onClick={() =>
                          handleResultSort(
                            column.resetSort ? 'default' : column.sortKey!,
                          )
                        }
                        aria-label={
                          column.resetSort
                            ? 'Nulstil sortering til standardrækkefølge'
                            : `Sorter efter ${column.label.toLowerCase()}`
                        }
                      >
                        {column.label}
                        {column.sortKey ? (
                          <SortIndicatorIcon
                            sortKey={column.sortKey}
                            activeSortKey={resultSort.key}
                            direction={resultSort.direction}
                          />
                        ) : null}
                      </TableHeaderButton>
                    ) : (
                      column.label
                    )}
                  </TableHeaderCell>
                ))}
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
                      onRowSelect?.(
                        nextId && row.sourceCategory
                          ? row.sourceCategory
                          : null,
                      );
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        lastResultTriggerRef.current =
                          event.currentTarget as HTMLElement;
                        const nextId =
                          selectedResultRowId === row.id ? null : row.id;
                        setSelectedResultRowId(nextId);
                        onRowSelect?.(
                          nextId && row.sourceCategory
                            ? row.sourceCategory
                            : null,
                        );
                      }
                    }}
                    tabIndex={0}
                    aria-expanded={isSelected}
                    aria-label={`Vis indsigt for ${row.name}`}
                  >
                    {resultTableColumns.map((column) => (
                      <TableCell
                        key={`${row.id}-${column.key}`}
                        className={column.cellClassName?.(row) ?? ''}
                      >
                        {column.renderValue(row)}
                      </TableCell>
                    ))}
                  </TableRow>,
                  isSelected && selectedResultRow ? (
                    <TableRow
                      key={`${row.id}-context`}
                      className='dd-row-context-enter'
                    >
                      <TableCell colSpan={5} className='overflow-visible p-0'>
                        <div className='relative mt-1 overflow-hidden border-l-4 border-l-datadein-marine bg-tremor-background-muted px-4 pb-4 pt-4'>
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
                            className='mt-4 gap-3 overflow-hidden'
                          >
                            <Card className='break-words overflow-hidden p-3'>
                              <Text className='dd-section-header m-0'>
                                Afvigelsesformel
                              </Text>
                              <Text className='mt-2 break-words text-tremor-content-emphasis'>
                                {formatCurrency(selectedResultRow.realized)} -{' '}
                                {formatCurrency(selectedResultRow.budget)} ={' '}
                                <span className='font-semibold text-tremor-content-strong'>
                                  {formatCurrency(selectedResultRow.diff)}
                                </span>
                              </Text>
                              <Text className='mt-1 break-words text-sm text-tremor-content-subtle'>
                                Afvigelse:{' '}
                                <span
                                  className={
                                    selectedResultRow.diffPct >= 0
                                      ? 'font-bold text-emerald-600'
                                      : 'font-bold text-rose-600'
                                  }
                                >
                                  {selectedResultRow.diffPct.toFixed(1)}%
                                </span>
                              </Text>
                            </Card>

                            <Card className='break-words overflow-hidden p-3'>
                              <Text className='dd-section-header m-0'>
                                Nøgletal
                              </Text>
                              <div className='mt-2 space-y-1'>
                                {selectedVarianceImpactPct !== null ? (
                                  <Text className='break-words text-sm text-tremor-content-emphasis'>
                                    Andel af total afvigelse:{' '}
                                    <span className='font-bold text-emerald-600'>
                                      {selectedVarianceImpactPct.toFixed(1)}%
                                    </span>
                                  </Text>
                                ) : (
                                  <Text className='break-words text-sm text-tremor-content-subtle'>
                                    Andel af total afvigelse: ikke relevant for
                                    subtotal/total
                                  </Text>
                                )}
                                {selectedVarianceRank !== null ? (
                                  <Text className='break-words text-sm text-tremor-content-emphasis'>
                                    Variansrang blandt linjeposter: #
                                    <span className='font-bold text-tremor-content-strong'>
                                      {selectedVarianceRank}
                                    </span>
                                  </Text>
                                ) : null}
                                {selectedBudgetPrecision !== null ? (
                                  <Text className='break-words text-sm text-tremor-content-emphasis'>
                                    Budgetpræcision:{' '}
                                    <span className='font-bold text-emerald-600'>
                                      {selectedBudgetPrecision.toFixed(1)}%
                                    </span>
                                  </Text>
                                ) : null}
                                {selectedContributionToNetDelta !== null ? (
                                  <Text className='break-words text-sm text-tremor-content-emphasis'>
                                    Bidrag til periodens netdelta:{' '}
                                    <span
                                      className={
                                        selectedContributionToNetDelta >= 0
                                          ? 'font-bold text-emerald-600'
                                          : 'font-bold text-rose-600'
                                      }
                                    >
                                      {selectedContributionToNetDelta.toFixed(
                                        1,
                                      )}
                                      %
                                    </span>
                                  </Text>
                                ) : (
                                  <Text className='break-words text-sm text-tremor-content-subtle'>
                                    Bidrag til periodens netdelta: ikke
                                    beregnelig (netdelta = 0)
                                  </Text>
                                )}
                              </div>
                            </Card>

                            <Card className='break-words overflow-hidden p-3'>
                              <Text className='dd-section-header m-0'>
                                Kategorikontekst
                              </Text>
                              <div className='mt-2 space-y-2'>
                                {selectedCategoryPoint ? (
                                  <>
                                    <Text className='break-words text-tremor-content-emphasis'>
                                      Realt beløb i kategori:{' '}
                                      <span
                                        className={getValueToneClass(
                                          selectedCategoryPoint.Belob,
                                        )}
                                      >
                                        {formatCurrency(
                                          selectedCategoryPoint.Belob,
                                        )}
                                      </span>
                                    </Text>
                                    {selectedCategoryShare !== null ? (
                                      <Text className='break-words text-sm text-tremor-content-subtle'>
                                        Andel af samlede omkostninger:{' '}
                                        <span className='font-bold text-tremor-content-strong'>
                                          {selectedCategoryShare.toFixed(1)}%
                                        </span>
                                      </Text>
                                    ) : null}
                                  </>
                                ) : (
                                  <Text className='break-words text-sm text-tremor-content-subtle text-wrap'>
                                    Ingen direkte kategori-match. Denne
                                    subtotal/total er beregnet ud fra den
                                    samlede periode og bruges som
                                    sammenligningsgrundlag.
                                  </Text>
                                )}
                                {selectedInsight?.summary ? (
                                  <Text className='break-words text-sm text-tremor-content-emphasis'>
                                    {selectedInsight.summary}
                                  </Text>
                                ) : null}
                              </div>
                            </Card>

                            <Card className='break-words overflow-hidden p-3'>
                              <Text className='dd-section-header m-0'>
                                Periodetryk
                              </Text>
                              {monthlyPressureSummary ? (
                                <div className='mt-2 space-y-1'>
                                  <Text className='break-words text-sm text-tremor-content-emphasis'>
                                    Bedre end budget:{' '}
                                    <span className='font-bold text-emerald-600'>
                                      {
                                        monthlyPressureSummary.monthsBetterThanBudget
                                      }{' '}
                                      mdr.
                                    </span>
                                  </Text>
                                  <Text className='break-words text-sm text-tremor-content-emphasis'>
                                    Dårligere end budget:{' '}
                                    <span className='font-bold text-rose-600'>
                                      {
                                        monthlyPressureSummary.monthsWorseThanBudget
                                      }{' '}
                                      mdr.
                                    </span>
                                  </Text>
                                  <Text className='break-words text-sm text-tremor-content-subtle'>
                                    Bedste måned:{' '}
                                    <span className='font-bold text-tremor-content-strong'>
                                      {
                                        monthlyPressureSummary.bestMonth
                                          .monthLabel
                                      }
                                    </span>{' '}
                                    ({' '}
                                    <span className='font-bold text-emerald-600'>
                                      {formatCurrency(
                                        monthlyPressureSummary.bestMonth.delta,
                                      )}
                                    </span>
                                    )
                                  </Text>
                                  <Text className='break-words text-sm text-tremor-content-subtle'>
                                    Værste måned:{' '}
                                    <span className='font-bold text-tremor-content-strong'>
                                      {
                                        monthlyPressureSummary.worstMonth
                                          .monthLabel
                                      }
                                    </span>{' '}
                                    ({' '}
                                    <span className='font-bold text-rose-600'>
                                      {formatCurrency(
                                        monthlyPressureSummary.worstMonth.delta,
                                      )}
                                    </span>
                                    )
                                  </Text>
                                </div>
                              ) : (
                                <Text className='mt-2 break-words text-sm text-tremor-content-subtle'>
                                  Ingen månedlige datapunkter tilgængelige for
                                  periodetryk.
                                </Text>
                              )}
                            </Card>

                            <Card className='break-words overflow-hidden p-3 lg:col-span-2'>
                              <Text className='dd-section-header m-0'>
                                Top bidragydere i perioden
                              </Text>
                              <div className='mt-2 space-y-2'>
                                {topAnsvarPreview.map((point) => (
                                  <Flex
                                    key={`ansvar-${point.name}`}
                                    justifyContent='between'
                                    className='gap-3'
                                  >
                                    <Text className='break-words text-sm text-tremor-content-emphasis'>
                                      {point.name}
                                    </Text>
                                    <Text className='break-words text-sm font-bold text-tremor-content-strong'>
                                      {formatCurrency(point.Belob)}
                                    </Text>
                                  </Flex>
                                ))}
                                {topFormaalPreview.slice(0, 1).map((point) => (
                                  <Text
                                    key={`formaal-${point.name}`}
                                    className='break-words text-xs text-tremor-content-subtle'
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
        </TableRoot>
      </div>
    </Card>
  );
}
