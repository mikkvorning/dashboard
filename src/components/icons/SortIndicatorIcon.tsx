type SortIndicatorKey = 'realized' | 'budget' | 'diff' | 'diffPct';

type SortIndicatorIconProps = {
  sortKey: SortIndicatorKey;
  activeSortKey: SortIndicatorKey | 'default';
  direction: 'asc' | 'desc';
  className?: string;
};

export function SortIndicatorIcon({
  sortKey,
  activeSortKey,
  direction,
  className,
}: SortIndicatorIconProps) {
  const isActive = activeSortKey === sortKey;
  const isAscending = direction === 'asc';

  return (
    <svg
      viewBox='0 0 16 16'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      className={`${className ?? 'h-5 w-5'} ${
        isActive ? 'text-datadein-marine' : 'text-tremor-content-subtle/60'
      }`}
      aria-hidden='true'
    >
      <path
        d='M5.2 6.3L8 3.5L10.8 6.3'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinecap='round'
        strokeLinejoin='round'
        opacity={isActive && isAscending ? 1 : 0.45}
      />
      <path
        d='M5.2 9.7L8 12.5L10.8 9.7'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinecap='round'
        strokeLinejoin='round'
        opacity={isActive && !isAscending ? 1 : 0.45}
      />
    </svg>
  );
}
