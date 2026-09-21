import { format, parse, isValid } from 'date-fns';
import { da } from 'date-fns/locale';

export type Scale = {
  divisor: number;
  suffix: string;
  label: string;
};

export type FormattedCompact = {
  value: string; // "59,12"
  unit: string; // "mio. kr."
  full: string; // "59,12 mio. kr."
};

/**
 * 1. Derives magnitude scale from an array of numbers or a single peak value.
 */
export const getScale = (data: number[] | number, unit = ''): Scale => {
  const values = Array.isArray(data) ? data : [data];
  const max = Math.max(...values.map((v) => Math.abs(v)), 0);

  if (max >= 1_000_000) {
    return {
      divisor: 1_000_000,
      suffix: 'mio.',
      label: ['mio.', unit].filter(Boolean).join(' '),
    };
  }
  if (max >= 1_000) {
    return {
      divisor: 1_000,
      suffix: 't.',
      label: ['t.', unit].filter(Boolean).join(' '),
    };
  }

  return { divisor: 1, suffix: '', label: unit };
};

/**
 * 2. Formats any number into value and unit parts.
 */
export const formatCompact = (
  value: number,
  options?: {
    scale?: Scale;
    divisor?: number;
    digits?: number;
    unit?: string;
  },
): FormattedCompact => {
  const divisor = options?.scale?.divisor ?? options?.divisor ?? 1;
  const digits = options?.digits ?? 1;
  const unit = options?.scale?.label ?? options?.unit ?? '';

  const scaledValue = value / divisor;
  const formattedValue = new Intl.NumberFormat('da-DK', {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  }).format(scaledValue);

  return {
    value: formattedValue,
    unit,
    full: unit ? `${formattedValue} ${unit}` : formattedValue,
  };
};

// Standard baseline helpers
export const formatCurrency = (value: number) =>
  new Intl.NumberFormat('da-DK', {
    style: 'currency',
    currency: 'DKK',
    maximumFractionDigits: 0,
  }).format(value);

export const formatNumber = (value: number) =>
  new Intl.NumberFormat('da-DK', { maximumFractionDigits: 0 }).format(value);

export const formatMonthLabel = (monthKey: string) => {
  if (!monthKey || typeof monthKey !== 'string') return monthKey || '';

  // Expecting "yyyy-MM" format (e.g. "2023-06")
  const parsed = parse(monthKey, 'yyyy-MM', new Date());

  if (!isValid(parsed)) {
    return monthKey; // Fallback to raw string if parsing fails instead of crashing
  }

  return format(parsed, "MMM ''yy", { locale: da });
};

export const getEventName = (event: unknown) => {
  if (!event || typeof event !== 'object') return null;
  const value = event as Record<string, unknown>;
  const candidates = [value.name, value.monthLabel, value.index];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.length > 0) {
      return candidate;
    }
  }
  return null;
};
