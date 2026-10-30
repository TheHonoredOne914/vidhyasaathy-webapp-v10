export function monthDays(today: string, studied: string[], frozen: string[]) {
  const [year, month] = today.split('-').map(Number);
  const first = new Date(Date.UTC(year!, month! - 1, 1));
  const start = 1 - (first.getUTCDay() + 6) % 7;
  const last = new Date(Date.UTC(year!, month!, 0)).getUTCDate();
  const count = Math.ceil((last - start + 1) / 7) * 7;
  const active = new Set(studied), freezes = new Set(frozen);
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(Date.UTC(year!, month! - 1, start + index));
    const day = date.toISOString().slice(0, 10);
    return { day, number: date.getUTCDate(), outside: date.getUTCMonth() !== month! - 1,
      today: day === today, studied: active.has(day), frozen: freezes.has(day) };
  });
}

export function monthAward(awardedAt: number, today: string) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit' }).format(new Date(awardedAt)) === today.slice(0, 7);
}
