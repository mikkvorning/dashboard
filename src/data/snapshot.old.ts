export type DashboardPoint = {
  month: string
  Belob: number
  BudgBelob: number
}

export type SliceValue = {
  name: string
  Belob: number
}

export type DashboardRangeData = {
  generatedAt: string
  range: '1Y' | '3Y' | 'ALL'
  kpis: {
    belob: number
    budget: number
    timer: number
    elever: number
  }
  monthly: DashboardPoint[]
  topAnsvar: SliceValue[]
  topKonto: SliceValue[]
  projects: SliceValue[]
}

export const snapshot1Y: DashboardRangeData = {
  generatedAt: '2026-09-09T09:30:00Z',
  range: '1Y',
  kpis: {
    belob: 59123000,
    budget: 57850000,
    timer: 101240,
    elever: 712,
  },
  monthly: [
    { month: '2025-10', Belob: 4180000, BudgBelob: 4020000 },
    { month: '2025-11', Belob: 4290000, BudgBelob: 4070000 },
    { month: '2025-12', Belob: 4510000, BudgBelob: 4380000 },
    { month: '2026-01', Belob: 4620000, BudgBelob: 4450000 },
    { month: '2026-02', Belob: 4750000, BudgBelob: 4580000 },
    { month: '2026-03', Belob: 4890000, BudgBelob: 4720000 },
    { month: '2026-04', Belob: 5010000, BudgBelob: 4840000 },
    { month: '2026-05', Belob: 5170000, BudgBelob: 4960000 },
    { month: '2026-06', Belob: 5260000, BudgBelob: 5030000 },
    { month: '2026-07', Belob: 5380000, BudgBelob: 5160000 },
    { month: '2026-08', Belob: 5490000, BudgBelob: 5280000 },
    { month: '2026-09', Belob: 5573000, BudgBelob: 5360000 },
  ],
  topAnsvar: [
    { name: '101 Udd.chef Valdemar Munk', Belob: 10680000 },
    { name: '117 Vaskeri Drift Nord', Belob: 9820000 },
    { name: '141 Fagcenter Service Syd', Belob: 8740000 },
    { name: '153 Drift Teknik Midt', Belob: 7980000 },
    { name: '188 Administration Felles', Belob: 7240000 },
  ],
  topKonto: [
    { name: '4500 Taxametertilskud', Belob: 12470000 },
    { name: '5120 Lon fast personale', Belob: 11330000 },
    { name: '5260 Vikar og timelon', Belob: 9650000 },
    { name: '6200 Materialer og drift', Belob: 8910000 },
    { name: '7110 Energi og forsyning', Belob: 6320000 },
  ],
  projects: [
    { name: 'Digitalisering 2026', Belob: 8420000 },
    { name: 'Campus Vest Modernisering', Belob: 7010000 },
    { name: 'Laring i praksis', Belob: 6190000 },
    { name: 'Kompetenceloft', Belob: 5400000 },
    { name: 'Udstyrspulje', Belob: 4710000 },
  ],
}
