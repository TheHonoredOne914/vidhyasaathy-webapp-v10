import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export function DemoChart({ data, label }: { data: { name: string; minutes: number }[]; label: string }) {
  return <figure className="demo-chart"><figcaption>{label}</figcaption><div className="demo-chart-canvas"><ResponsiveContainer width="100%" height="100%" minWidth={0}><BarChart data={data} margin={{ top: 12, right: 10, bottom: 0, left: -20 }} accessibilityLayer>
    <CartesianGrid vertical={false} stroke="var(--nb-border)" strokeDasharray="3 5" /><XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: '#193E69', fontFamily: 'Patrick Hand', fontSize: 14 }} /><YAxis tickLine={false} axisLine={false} tick={{ fill: '#193E69', fontFamily: 'Patrick Hand', fontSize: 13 }} /><Tooltip cursor={{ fill: '#D6E2E6' }} contentStyle={{ fontFamily: 'Patrick Hand', background: '#F9F6EE', borderRadius: 12, borderColor: '#517DAB' }} /><Bar dataKey="minutes" name="Minutes" fill="#517DAB" radius={[6, 6, 0, 0]} maxBarSize={42} isAnimationActive={false} />
  </BarChart></ResponsiveContainer></div><details><summary>View chart data</summary><table><thead><tr><th>Period or activity</th><th>Minutes</th></tr></thead><tbody>{data.map((row) => <tr key={row.name}><th>{row.name}</th><td>{row.minutes}</td></tr>)}</tbody></table></details></figure>;
}
