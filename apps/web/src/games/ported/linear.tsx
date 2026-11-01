import { useState } from 'react';
import { experiment, Slider } from './shared';

function LineLab() {
  const [total, setTotal] = useState(5), [x, setX] = useState(2);
  const y = total - x;
  return <div className="port-lab"><svg viewBox="0 0 480 330" role="img" aria-label={`Graph of x plus y equals ${total}, with point (${x}, ${y})`}>
    {Array.from({ length: 11 }, (_, i) => <g key={i} stroke="#D6E2E6"><path d={`M${60 + i * 28} 20V300M60 ${20 + i * 28}H340`} /></g>)}<path d="M60 20V300H350" stroke="currentColor" strokeWidth="2" /><path d={`M60 ${300 - total * 28}L${60 + total * 28} 300`} stroke="#517DAB" strokeWidth="4" /><circle cx={60 + x * 28} cy={300 - y * 28} r="8" fill="#193E69" /><text x="355" y="300">x</text><text x="35" y="25">y</text><text x="170" y="30">x + y = {total}</text><text x="220" y="80">({x}, {y})</text>
  </svg><div className="port-controls"><Slider label="Total" value={total} min={1} max={10} onChange={(v) => { setTotal(v); setX(Math.min(x, v)); }} /><Slider label="x coordinate" value={x} max={total} onChange={setX} /></div><p>{x} + {y} = {total}. Every point on the line is a solution. The graph continues beyond the portion shown.</p></div>;
}
export const game = experiment('linear', 'Line Builder', 'Linear Equations in Two Variables', LineLab, [
  ['Build a solution', 'Move a point while keeping x + y constant.'], ['Draw the relationship', 'The solution pairs lie on a straight line.'],
  ['Meet the axes', 'On the y-axis, x is zero.'], ['Keep exploring', 'A line contains infinitely many solution points.'],
]);
