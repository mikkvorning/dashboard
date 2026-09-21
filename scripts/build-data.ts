import fs from 'node:fs';
import path from 'node:path';

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

function formatMonthKey(yrMdr: number | string): string {
  if (!yrMdr) return '';
  const str = String(yrMdr).replace(/\D/g, '');
  if (str.length === 6) {
    const year = str.substring(0, 4);
    const month = str.substring(4, 6);
    const mNum = parseInt(month, 10);
    if (mNum >= 1 && mNum <= 12) {
      return `${year}-${month}`;
    }
  }
  return '';
}

function processDataset(
  rows: RawRow[],
  range: '1Y' | '3Y' | 'ALL',
): DashboardRangeData {
  // 1. Extract all unique months in proper order
  const allMonths = Array.from(
    new Set(
      rows.map((r) => formatMonthKey(r.ÅrMdr)).filter((m) => m.length === 7), // Strictly keep "YYYY-MM"
    ),
  ).sort();

  // Find months that actually contain 'Realiseret' data
  const realiseretMonths = Array.from(
    new Set(
      rows
        .filter(
          (r) => String(r.BudgVersion).trim().toLowerCase() === 'realiseret',
        )
        .map((r) => formatMonthKey(r.ÅrMdr))
        .filter((m) => m.length === 7), // Strictly keep "YYYY-MM",
    ),
  ).sort();

  let targetMonths = allMonths;

  if (range === '1Y') {
    // Pick the last 12 months containing realiseret data (or last 12 overall as fallback)
    const baseList =
      realiseretMonths.length >= 12 ? realiseretMonths : allMonths;
    targetMonths = baseList.slice(-12);
  } else if (range === '3Y') {
    const baseList =
      realiseretMonths.length >= 36 ? realiseretMonths : allMonths;
    targetMonths = baseList.slice(-36);
  }

  const activeMonthsSet = new Set(targetMonths);

  const filteredRows = rows.filter((r) =>
    activeMonthsSet.has(formatMonthKey(r.ÅrMdr)),
  );

  let totalBelob = 0;
  let totalBudgBelob = 0;
  let totalAe = 0;
  let totalBudgAe = 0;
  let totalTimer = 0;
  let totalElever = 0;

  const monthlyMap = new Map<string, { Belob: number; BudgBelob: number }>();
  for (const month of targetMonths) {
    monthlyMap.set(month, { Belob: 0, BudgBelob: 0 });
  }

  const ansvarMap = new Map<string, number>();
  const formaalMap = new Map<string, number>();
  const kontoMap6Map = new Map<string, number>();

  for (const row of filteredRows) {
    const monthKey = formatMonthKey(row.ÅrMdr);
    const versionStr = String(row.BudgVersion || '')
      .trim()
      .toLowerCase();
    const isRealiseret = versionStr === 'realiseret';

    const belob = Number(row.Beløb) || 0;
    const budgBelob = Number(row.BudgBeløb) || 0;
    const ae = Number(row.ÅE) || 0;
    const budgAe = Number(row.BudgÅE) || 0;
    const timer = Number(row.Timer) || 0;
    const elever = Number(row.Elever) || 0;

    // Use Beløb for Realiseret, fallback to BudgBeløb for non-realized rows in breakdown maps
    const activeValue = isRealiseret ? belob : budgBelob;

    if (isRealiseret) {
      totalBelob += belob;
      totalAe += ae;
      totalTimer += timer;
      totalElever += elever;

      const monthly = monthlyMap.get(monthKey);
      if (monthly) monthly.Belob += belob;
    }

    totalBudgBelob += budgBelob;
    totalBudgAe += budgAe;

    const monthly = monthlyMap.get(monthKey);
    if (monthly) monthly.BudgBelob += budgBelob;

    // Categorical breakdown maps
    if (row.AnsvarsNrNavn) {
      ansvarMap.set(
        row.AnsvarsNrNavn,
        (ansvarMap.get(row.AnsvarsNrNavn) || 0) + activeValue,
      );
    }

    if (row.FormålsNrNavn) {
      formaalMap.set(
        row.FormålsNrNavn,
        (formaalMap.get(row.FormålsNrNavn) || 0) + activeValue,
      );
    }

    if (row.KontoMap6) {
      kontoMap6Map.set(
        row.KontoMap6,
        (kontoMap6Map.get(row.KontoMap6) || 0) + activeValue,
      );
    }
  }

  const monthlyPoints: DashboardPoint[] = Array.from(monthlyMap.entries()).map(
    ([month, values]) => ({
      month,
      Belob: Math.round(values.Belob),
      BudgBelob: Math.round(values.BudgBelob),
    }),
  );

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
