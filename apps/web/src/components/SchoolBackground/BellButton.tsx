import { useEffect, useRef, type MouseEvent } from 'react';

const PAPER = `<svg viewBox="0 0 22 16" width="22" height="16"><path d="M1 2 L21 1 L20 14 L2 15Z" fill="#F9F6EE" stroke="#28517C" stroke-width="1.2"/><path d="M4 6 h12 M4 10 h9" stroke="#517DAB" stroke-width="1"/></svg>`;
const PLANE = `<svg viewBox="0 0 30 22" width="30" height="22"><path d="M1 10 L29 1 L21 21 L14 13Z" fill="#D6E2E6" stroke="#28517C" stroke-width="1.5" stroke-linejoin="round"/></svg>`;

export function BellButton() {
  const timers = useRef<number[]>([]);

  useEffect(() => () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    document.querySelectorAll('.school-scrap, .school-chhutti').forEach((node) => node.remove());
  }, []);

  function ring(event: MouseEvent<HTMLButtonElement>) {
    const button = event.currentTarget;
    button.classList.remove('is-ringing');
    void button.offsetWidth;
    button.classList.add('is-ringing');
    document.querySelectorAll('.school-scrap, .school-chhutti').forEach((node) => node.remove());
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduced) {
      const rect = button.getBoundingClientRect();
      const originX = rect.left + rect.width / 3;
      const originY = rect.top + rect.height / 2;
      for (let index = 0; index < 8; index += 1) {
        const scrap = document.createElement('span');
        scrap.className = 'school-scrap';
        const angle = Math.PI * (0.2 + 0.6 * Math.random());
        const distance = 80 + Math.random() * 120;
        scrap.style.left = `${originX}px`;
        scrap.style.top = `${originY}px`;
        scrap.style.setProperty('--x', `${Math.cos(angle) * distance * (index % 2 ? 1 : -1)}px`);
        scrap.style.setProperty('--y', `${Math.sin(angle) * distance}px`);
        scrap.style.setProperty('--r', `${Math.random() * 240 - 120}deg`);
        scrap.innerHTML = index % 3 === 0 ? PLANE : PAPER;
        document.body.appendChild(scrap);
        timers.current.push(window.setTimeout(() => scrap.remove(), 1500));
      }
    }
    const hour = document.getElementById('school-clock-hour');
    const minute = document.getElementById('school-clock-minute');
    if (hour) hour.style.transform = 'rotate(110deg)';
    if (minute) minute.style.transform = 'rotate(240deg)';
    const card = document.createElement('div');
    card.className = 'school-chhutti';
    card.textContent = '3:40, chhutti!';
    document.body.appendChild(card);
    timers.current.push(window.setTimeout(() => card.remove(), 2600));
  }

  return (
    <button className="school-bell" type="button" aria-label="Ring the school bell" onClick={ring}>
      <svg viewBox="0 0 40 42" aria-hidden="true" fill="none" stroke="#28517C" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 2 v5" />
        <path d="M6 32 C8 20,6 8,20 7 C34 8,32 20,34 32 Z" fill="#D6E2E6" />
        <path d="M3 33 H37" />
        <circle cx="20" cy="37" r="3.2" fill="#041D3D" stroke="#041D3D" />
      </svg>
      <span>ring the bell</span>
    </button>
  );
}
