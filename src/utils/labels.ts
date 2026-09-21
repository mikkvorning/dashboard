type LabelVariant = 'default' | 'adjective';

type LabelEntry =
  | string
  | {
      default: string;
      adjective?: string;
    };

type LabelMap = Record<string, LabelEntry>;

export const createLabelFactory = (map: LabelMap) => {
  return (key: string, variant: LabelVariant = 'default') => {
    const entry = map[key];

    if (!entry) {
      return key;
    }

    if (typeof entry === 'string') {
      return entry;
    }

    if (variant === 'adjective' && entry.adjective) {
      return entry.adjective;
    }

    return entry.default;
  };
};

export const formatRangeLabel = createLabelFactory({
  '1Y': {
    default: '1 år',
    adjective: '1 års',
  },
  '3Y': {
    default: '3 år',
    adjective: '3 års',
  },
  ALL: {
    default: 'Alt',
    adjective: 'Al',
  },
});
