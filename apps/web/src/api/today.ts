import type { StudentHome } from '@vidhyasaathy/contracts';
import { useRemote } from '../setup/useRemote';
import { TodayPlanSchema, type TodayPlan } from './student-flow-types';

export function fallbackToday(home: StudentHome): TodayPlan {
  const action = home.nextAction;
  return {
    date: home.greeting.dateIST, greeting: home.greeting.line, source: 'mock', streakDays: home.streak.currentDays,
    primary: action ? {
      kind: action.kind === 'catchup' ? 'catchup' : action.kind === 'game' ? 'play' : 'start_chapter',
      title: action.title, subtitle: action.kind === 'catchup' && home.catchUp ? home.catchUp.copy : 'Pick up where you left off. Your work is saved.',
      href: action.href, estMinutes: action.estMinutes,
    } : { kind: 'start_chapter', title: 'Choose a chapter to begin', subtitle: 'One idea at a time, at your pace.', href: '/student?panel=subjects', estMinutes: 10 },
    next: home.todaysGoal.items.slice(0, 3).map((item) => ({ kind: 'revise', title: item.label, subtitle: item.done ? 'Finished' : 'Ready when you are', href: item.href, estMinutes: 5 })),
  };
}

export function useTodayPlan(home: StudentHome | null) {
  const today = useRemote('/student/today', TodayPlanSchema);
  return { ...today, data: today.data ?? (home ? fallbackToday(home) : null) };
}
