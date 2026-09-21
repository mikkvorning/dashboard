import type { CSSProperties, ReactNode } from 'react';
import { useFlipCard } from '../hooks/useFlipCard';
import '../styles/flip-card.css';

export const MIN_LOAD_DELAY = 100;

type FlipCardProps = {
  children: ReactNode;
  isLoading: boolean;
  isInitialLoad?: boolean;
  loadToken: number;
  minDelay?: number;
  cardId: string;
  onBackfaceReady?: (loadToken: number, cardId: string) => void;
};

export function FlipCard({
  children,
  isLoading,
  isInitialLoad = false,
  loadToken,
  minDelay = MIN_LOAD_DELAY,
  cardId,
  onBackfaceReady,
}: FlipCardProps) {
  const { config, axisTransform } = useFlipCard({
    isLoading,
    isInitialLoad,
    loadToken,
    minDelay,
    cardId,
    onBackfaceReady,
  });

  return (
    <div
      className={`dd-flip-card h-full w-full self-stretch ${
        config.axis === 'y' ? 'dd-flip-axis-y' : 'dd-flip-axis-x'
      }`}
      style={{ perspective: '1200px' } satisfies CSSProperties}
    >
      <div
        className='dd-flip-inner h-full'
        style={{
          transform: axisTransform,
          transitionDuration: `${config.duration}ms`,
          transitionTimingFunction: 'cubic-bezier(0.65, 0, 0.35, 1)',
        }}
      >
        <div className='dd-flip-face dd-flip-front h-full w-full'>
          {children}
        </div>
        <div className='dd-flip-face dd-flip-back h-full' aria-hidden='true'>
          <div className='dd-flip-back-surface h-full rounded-tremor-default'>
            <span className='dd-flip-back-mark' />
          </div>
        </div>
      </div>
    </div>
  );
}
