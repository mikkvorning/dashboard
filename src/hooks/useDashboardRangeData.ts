import { useCallback, useEffect, useMemo, useState } from 'react';

import { initialSnapshot, type DashboardRangeData } from '../data/snapshot';

export type DashboardRangeKey = '1Y' | '3Y' | 'ALL';

type UseDashboardRangeDataOptions = {
  selectedRange: DashboardRangeKey;
  canCommitRange: boolean;
};

export function useDashboardRangeData({
  selectedRange,
  canCommitRange,
}: UseDashboardRangeDataOptions) {
  const [rangeCache, setRangeCache] = useState<
    Partial<Record<DashboardRangeKey, DashboardRangeData>>
  >({});
  const [displayedRange, setDisplayedRange] =
    useState<DashboardRangeKey>(selectedRange);
  const [error, setError] = useState<string | null>(null);

  const isInitialLoad = Object.keys(rangeCache).length === 0 && error === null;
  const isLoading =
    (displayedRange !== selectedRange || !rangeCache[selectedRange]) &&
    error === null;

  useEffect(() => {
    if (rangeCache[selectedRange] || error !== null) {
      return;
    }

    let cancelled = false;

    const loadData = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.BASE_URL}data/${selectedRange}.json`,
        );

        if (!response.ok) {
          throw new Error(
            `Kunne ikke hente dashboard data (${response.status})`,
          );
        }

        const payload = (await response.json()) as DashboardRangeData;

        if (!cancelled) {
          setRangeCache((previous) => ({
            ...previous,
            [selectedRange]: payload,
          }));
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Kunne ikke hente data',
          );
        }
      }
    };

    void loadData();

    return () => {
      cancelled = true;
    };
  }, [error, rangeCache, selectedRange]);

  useEffect(() => {
    if (
      displayedRange === selectedRange ||
      !canCommitRange ||
      !rangeCache[selectedRange]
    ) {
      return;
    }

    const commitTimer = window.setTimeout(() => {
      setDisplayedRange((previous) =>
        previous === selectedRange ? previous : selectedRange,
      );
    }, 0);

    return () => window.clearTimeout(commitTimer);
  }, [canCommitRange, displayedRange, rangeCache, selectedRange]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const activeData = useMemo(
    () => rangeCache[displayedRange] ?? initialSnapshot,
    [displayedRange, rangeCache],
  );

  return {
    activeData,
    error,
    clearError,
    isLoading,
    isInitialLoad,
  };
}
