/// <reference types="node" />

import fs from 'fs';
import path from 'path';

type RawRow = {
  År: number;
  Måned: number;
  ÅrMdr: number | string;
  BudgVersion: string;
  AnsvarsNrNavn: string | null;
  FormålsNrNavn: string | null;
  KontoMap6: string | null;
  Beløb: number | null;
  BudgBeløb: number | null;
  ÅE: number | null;
  BudgÅE: number | null;
  Timer: number | null;
  Elever: number | null;
};

type SliceValue = {
  name: string;
  Belob: number;
};

type DashboardPoint = {
  month: string;
  Belob: number;
  BudgBelob: number;
};

type DashboardRangeData = {
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

// Helper to format 202306 into "2023-06"
function formatMonthKey(yrMdr: number | string): string {
  const str = String(yrMdr);
  if (str.length === 6) {
    return `${str.substring(0, 4)}-${str.substring(4, 6)}`;
  }
  return str;
}

function processDataset(
  rows: RawRow[],
  range: '1Y' | '3Y' | 'ALL',
): DashboardRangeData {
  // 1. Determine available months and cutoff window
  const allMonths = Array.from(
    new Set(rows.map((r) => formatMonthKey(r.ÅrMdr))),
  ).sort();

  let targetMonths = allMonths;
  if (range === '1Y') {
    targetMonths = allMonths.slice(-12);
  } else if (range === '3Y') {
    targetMonths = allMonths.slice(-36);
  }

  const activeMonthsSet = new Set(targetMonths);

  // 2. Filter rows by active time range
  const filteredRows = rows.filter((r) =>
    activeMonthsSet.has(formatMonthKey(r.ÅrMdr)),
  );

  // 3. Accumulate KPIs & Monthly Series
  let totalBelob = 0;
  let totalBudgBelob = 0;
  let totalAe = 0;
  let totalBudgAe = 0;
  let totalTimer = 0;
  let totalElever = 0;

  const monthlyMap = new Map<string, { Belob: number; BudgBelob: number }>();

  // Aggregation maps for categorical views
  const ansvarMap = new Map<string, number>();
  const formaalMap = new Map<string, number>();
  const kontoMap6Map = new Map<string, number>();

  for (const month of targetMonths) {
    monthlyMap.set(month, { Belob: 0, BudgBelob: 0 });
  }

  for (const row of filteredRows) {
    const monthKey = formatMonthKey(row.ÅrMdr);
    const isRealiseret = row.BudgVersion === 'Realiseret';

    const belob = row.Beløb || 0;
    const budgBelob = row.BudgBeløb || 0;
    const ae = row.ÅE || 0;
    const budgAe = row.BudgÅE || 0;
    const timer = row.Timer || 0;
    const elever = row.Elever || 0;

    // Actuals (Realiseret)
    if (isRealiseret) {
      totalBelob += belob;
      totalAe += ae;
      totalTimer += timer;
      totalElever += elever;

      const monthly = monthlyMap.get(monthKey);
      if (monthly) monthly.Belob += belob;

      if (row.AnsvarsNrNavn) {
        ansvarMap.set(
          row.AnsvarsNrNavn,
          (ansvarMap.get(row.AnsvarsNrNavn) || 0) + belob,
        );
      }

      if (row.FormålsNrNavn) {
        formaalMap.set(
          row.FormålsNrNavn,
          (formaalMap.get(row.FormålsNrNavn) || 0) + belob,
        );
      }

      if (row.KontoMap6) {
        kontoMap6Map.set(
          row.KontoMap6,
          (kontoMap6Map.get(row.KontoMap6) || 0) + belob,
        );
      }
    }

    // Budget Target
    totalBudgBelob += budgBelob;
    totalBudgAe += budgAe;

    const monthly = monthlyMap.get(monthKey);
    if (monthly) monthly.BudgBelob += budgBelob;
  }

  // Format Monthly Array
  const monthlyPoints: DashboardPoint[] = Array.from(monthlyMap.entries()).map(
    ([month, values]) => ({
      month,
      Belob: Math.round(values.Belob),
      BudgBelob: Math.round(values.BudgBelob),
    }),
  );

  // Top 5 Helpers
  const getTopN = (map: Map<string, number>, n = 5): SliceValue[] =>
    Array.from(map.entries())
      .map(([name, Belob]) => ({ name, Belob: Math.round(Belob) }))
      .sort((a, b) => Math.abs(b.Belob) - Math.abs(a.Belob))
      .slice(0, n);

  return {
    generatedAt: new Date().toISOString(),
    range,
    kpis: {
      belob: Math.round(totalBelob),
      budgBelob: Math.round(totalBudgBelob),
      ae: Number(totalAe.toFixed(2)),
      budgAe: Number(totalBudgAe.toFixed(2)),
      timer: Math.round(totalTimer),
      elever: Math.round(totalElever),
    },
    monthly: monthlyPoints,
    topAnsvar: getTopN(ansvarMap, 5),
    topFormaal: getTopN(formaalMap, 5),
    byKontoMap6: getTopN(kontoMap6Map, 10),
  };
}

// Execution Entry
function run() {
  const inputFile = path.join(process.cwd(), 'VaskAfData.dashboard.json');
  const outputDir = path.join(process.cwd(), 'public', 'data');

  if (!fs.existsSync(inputFile)) {
    console.error(`Input file not found at ${inputFile}`);
    process.exit(1);
  }

  console.log('Reading raw JSON dataset...');
  const rawContent = fs.readFileSync(inputFile, 'utf-8');
  const parsed = JSON.parse(rawContent);
  const rows: RawRow[] = parsed.rows || parsed;

  console.log(`Processing ${rows.length} rows...`);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const ranges: Array<'1Y' | '3Y' | 'ALL'> = ['1Y', '3Y', 'ALL'];

  for (const range of ranges) {
    const data = processDataset(rows, range);
    const outputPath = path.join(outputDir, `${range}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
    console.log(`Saved: public/data/${range}.json`);
  }

  console.log('Done aggregating dashboard data!');
}

run();
