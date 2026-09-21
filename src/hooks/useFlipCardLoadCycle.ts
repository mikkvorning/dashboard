import { useCallback, useMemo, useState } from 'react';

export function useFlipCardLoadCycle(totalCards: number) {
  const [loadToken, setLoadToken] = useState(0);
  const [readyState, setReadyState] = useState<{
    token: number;
    ids: Set<string>;
  }>({ token: 0, ids: new Set() });

  const beginLoadCycle = useCallback(() => {
    setLoadToken((token) => token + 1);
  }, []);

  const handleCardBackfaceReady = useCallback(
    (token: number, cardId: string) => {
      setReadyState((previous) => {
        if (previous.token !== token) {
          return { token, ids: new Set([cardId]) };
        }

        if (previous.ids.has(cardId)) {
          return previous;
        }

        const next = new Set(previous.ids);
        next.add(cardId);
        return { token, ids: next };
      });
    },
    [],
  );

  const areCardsReadyForLoad = useMemo(
    () => readyState.token === loadToken && readyState.ids.size >= totalCards,
    [loadToken, readyState, totalCards],
  );

  return {
    loadToken,
    beginLoadCycle,
    handleCardBackfaceReady,
    areCardsReadyForLoad,
  };
}
