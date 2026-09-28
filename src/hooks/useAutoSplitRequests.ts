import { useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { catalogMonthly } from '@/data/services';
import { useKeel } from '@/store/keel-store';
import type { Team } from '@/types';

function isArmed(team: Team): boolean {
  const { split } = team;
  if (split.mode !== 'equal' || split.route === 'none') return false;
  if (!split.nextAt || Date.parse(split.nextAt) > Date.now()) return false;
  const total = split.total !== undefined ? split.total : catalogMonthly(team.serviceIds);
  return total > 0;
}

export function useAutoSplitRequests() {
  const { state, hydrated, fireSplitAt } = useKeel();
  const busy = useRef(false);

  const run = useCallback(() => {
    if (!hydrated || busy.current) return;
    const due = state.teams.find(isArmed);
    if (!due) return;

    busy.current = true;
    fireSplitAt(due.gridX, due.gridY);
    busy.current = false;
  }, [fireSplitAt, hydrated, state.teams]);

  useEffect(() => {
    run();
  }, [run]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (status) => {
      if (status === 'active') run();
    });
    return () => sub.remove();
  }, [run]);
}
