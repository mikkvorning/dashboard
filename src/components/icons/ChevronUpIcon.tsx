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
      style={{
        width: '16px',
        height: '16px',
        minWidth: '16px',
        minHeight: '16px',
        display: 'inline-block',
      }}
      aria-hidden='true'
    >
      <path
        d='M5 12L10 7L15 12'
        stroke='#475569'
        strokeWidth={strokeWidth}
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  );
}
