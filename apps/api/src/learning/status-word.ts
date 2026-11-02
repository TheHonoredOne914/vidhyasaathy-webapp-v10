export function statusWordFor(mastery: number, attempts: number) {
  return attempts === 0 ? 'New' : mastery < 0.4 ? "Let's fix this" : mastery < 0.7 ? 'Almost there' : mastery < 0.9 ? 'Mastered' : 'Top form';
}
