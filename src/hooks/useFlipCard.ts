import { useEffect, useMemo, useState } from 'react';

export type FlipAxis = 'x' | 'y';

export type FlipConfig = {
  axis: FlipAxis;
  delay: number;
  duration: number;
  hold: number;
};

const randomBetween = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const createFlipConfig = (): FlipConfig => ({
  axis: Math.random() < 0.5 ? 'x' : 'y',
  delay: randomBetween(40, 150),
  duration: randomBetween(220, 600),
  hold: 100,
});

type UseFlipCardOptions = {
  isLoading: boolean;
  isInitialLoad: boolean;
  loadToken: number;
  minDelay: number;
  cardId: string;
  onBackfaceReady?: (loadToken: number, cardId: string) => void;
};

export function useFlipCard({
  isLoading,
  isInitialLoad,
  loadToken,
  minDelay,
  cardId,
  onBackfaceReady,
}: UseFlipCardOptions) {
  const config = useMemo(() => createFlipConfig(), [loadToken]);
  const [flippedToken, setFlippedToken] = useState<number | null>(null);

  useEffect(() => {
    // On the initial load the card starts on its backface immediately. The
    // actual data request happens in App.tsx without waiting for this hook,
    // and the card flips to its front only once isLoading becomes false.
    if (isInitialLoad) {
      return;
    }

    let cancelled = false;

    const flipTimer = window.setTimeout(() => {
      if (cancelled) return;
      setFlippedToken(loadToken);
    }, config.delay);

    // The cards only need a brief backface hold before the request starts.
    // Keep minDelay as an optional lower bound, but never let it create
    // an unexpectedly long visible loading state.
    const readyDelay = Math.max(
      minDelay,
      config.delay + config.duration + config.hold,
    );

    const readyTimer = window.setTimeout(() => {
      if (cancelled) return;

      onBackfaceReady?.(loadToken, cardId);
    }, readyDelay);

    return () => {
      cancelled = true;
      window.clearTimeout(flipTimer);
      window.clearTimeout(readyTimer);
    };
  }, [
    config.delay,
    config.duration,
    config.hold,
    isInitialLoad,
    loadToken,
    minDelay,
    cardId,
    onBackfaceReady,
  ]);

  const isFlipped = isInitialLoad
    ? isLoading
    : isLoading && flippedToken === loadToken;

  return {
    config,
    isFlipped,
    axisTransform:
      config.axis === 'x'
        ? `rotateX(${isFlipped ? 180 : 0}deg)`
        : `rotateY(${isFlipped ? 180 : 0}deg)`,
  };
}
