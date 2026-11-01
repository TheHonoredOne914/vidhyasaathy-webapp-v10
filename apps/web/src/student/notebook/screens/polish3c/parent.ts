export function weekStartIST(now = Date.now()) {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const part = (type: string) => Number(parts.find((row) => row.type === type)?.value);
  const date = new Date(Date.UTC(part('year'), part('month') - 1, part('day')));
  date.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 6) % 7);
  return date.getTime() - 5.5 * 60 * 60 * 1000;
}
