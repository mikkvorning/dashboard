type ChevronUpIconProps = {
  className?: string;
  strokeWidth?: number;
};

export function ChevronUpIcon({
  className,
  strokeWidth = 1.8,
}: ChevronUpIconProps) {
  return (
    <svg
      viewBox='0 0 20 20'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      className={className}
      aria-hidden='true'
    >
      <path
        d='M5 12L10 7L15 12'
        stroke='currentColor'
        strokeWidth={strokeWidth}
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  );
}
