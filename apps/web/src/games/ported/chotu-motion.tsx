import { useState } from 'react';
import { experiment, Slider } from './shared';

function Journey() {
  const [speed, setSpeed] = useState(4), [out, setOut] = useState(5), [back, setBack] = useState(0);
  const distance = speed * (out + back), displacement = speed * (out - back), time = out + back;
  return <div className="port-lab"><svg viewBox="0 0 480 300" role="img" aria-label="Chotu travels out and back along a straight road, with a position-time graph below">
    <text x="25" y="25">Chotu ki Kahani · ghar se school</text><path d="M30 105H450" stroke="#517DAB" strokeWidth="3" /><text x="25" y="90">Home</text><text x="390" y="90">School</text><circle cx={Math.min(445, Math.max(35, 200 + displacement * 3))} cy="95" r="10" fill="#193E69" /><path d="M45 155V260H440" stroke="currentColor" fill="none" /><polyline points={`45,250 ${45 + out * 17},${250 - speed * out * 1.4} ${45 + time * 17},${250 - displacement * 1.4}`} stroke="#28517C" fill="none" strokeWidth="4" /><text x="50" y="150">Position (m)</text><text x="350" y="285">Time (s)</text>
  </svg><div className="port-readout"><span>Distance / doori: {distance} m</span><span>Displacement: {displacement} m</span><span>Average speed: {time ? (distance / time).toFixed(1) : '0'} m/s</span><span>Average velocity: {time ? (displacement / time).toFixed(1) : '0'} m/s</span></div><div className="port-controls"><Slider label="Speed" value={speed} min={1} max={8} unit="m/s" onChange={setSpeed} /><Slider label="Outward journey" value={out} max={10} unit="s" onChange={setOut} /><Slider label="Return journey" value={back} max={10} unit="s" onChange={setBack} /></div><p>Come back home: the distance still grows, but displacement can become zero.</p></div>;
}
export const game = experiment('chotu-motion', 'Chotu ki Kahani: Motion', 'Motion', Journey, [
  ['Chotu leaves home', 'Compare equal distances in equal times.'], ['Doori aur samay', 'Speed is distance divided by time.'],
  ['The return journey', 'Compare distance with displacement on a journey out and back.'], ['Read the journey', 'A steeper position-time graph means a greater speed.'],
]);
