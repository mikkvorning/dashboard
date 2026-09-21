export type DashboardPoint = {
  month: string;
  Belob: number;
  BudgBelob: number;
};

export type SliceValue = {
  name: string;
  Belob: number;
  BudgBelob: number;
};

export type DashboardRangeData = {
  generatedAt: string;
  range: '1Y' | '3Y' | 'ALL';
  kpis: {
    belob: number;
    budgBelob: number;
    ae: number;
    budgAe: number;
    timer: number;
    elever: number;
  };
  monthly: DashboardPoint[];
  topAnsvar: SliceValue[];
  topFormaal: SliceValue[];
  byKontoMap6: SliceValue[];
};

// Fallback skeleton state while initial json loads
export const initialSnapshot: DashboardRangeData = {
  generatedAt: new Date().toISOString(),
  range: '1Y',
  kpis: {
    belob: 0,
    budgBelob: 0,
    ae: 0,
    budgAe: 0,
    timer: 0,
    elever: 0,
  },
  monthly: [],
  topAnsvar: [],
  topFormaal: [],
  byKontoMap6: [],
};
