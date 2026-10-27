const C = '#041D3D';
const D = '#193E69';
const K = '#28517C';
const U = '#517DAB';
const V = '#F9F6EE';
const I = '#D6E2E6';

const sceneNames = ['hero', 'who', 'day', 'games', 'board', 'learn', 'safety', 'faq', 'vision', 'cover'] as const;
export type SceneName = (typeof sceneNames)[number];

function gradient(id: string, stops: string[]) {
  const marks = stops.map((color, index) => `<stop offset="${index === 0 ? 0 : index === stops.length - 1 ? 1 : (index / (stops.length - 1)).toFixed(2)}" stop-color="${color}"/>`).join('');
  return `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">${marks}</linearGradient>`;
}

function cloud(x: number, y: number, s: number, opacity = 1, delay = 0) {
  return `<g class="school-drift" style="animation-delay:${delay}s;animation-duration:${80 + s * 24}s"><path transform="translate(${x} ${y}) scale(${s})" d="M10 40 C0 40,0 24,14 24 C14 10,34 6,42 16 C48 4,72 6,74 20 C90 18,94 40,78 40 Z" fill="${V}" fill-opacity="${opacity}" stroke="${U}" stroke-width="${1.6 / s}" stroke-linejoin="round"/></g>`;
}

function plane(y: number, delay: number, s = 1) {
  return `<g class="school-glide" style="animation-delay:${delay}s"><g transform="translate(0 ${y}) scale(${s})"><path d="M0 14 L44 0 L32 34 L22 20 Z" fill="${V}" stroke="${K}" stroke-width="2" stroke-linejoin="round"/><path d="M22 20 L44 0" stroke="${K}" stroke-width="1.6"/><path d="M-30 20 q-20 6 -40 -2" fill="none" stroke="${U}" stroke-width="1.5" stroke-dasharray="2 6"/></g></g>`;
}

function bird(y: number, delay: number) {
  return `<g class="school-bird" style="animation-delay:${delay}s"><path class="school-flap" transform="translate(0 ${y})" d="M0 6 Q6 0 12 6 Q18 0 24 6" fill="none" stroke="${D}" stroke-width="2" stroke-linecap="round"/></g>`;
}

function kite(x: number, y: number) {
  return `<g transform="translate(${x} ${y})"><g class="school-kite"><path d="M0 -40 L24 0 L0 34 L-24 0 Z" fill="${I}" stroke="${K}" stroke-width="2"/><path d="M0 -40 V34 M-24 0 H24" stroke="${K}" stroke-width="1.4"/><path d="M0 34 q10 20 -6 36 q-14 16 4 34" fill="none" stroke="${K}" stroke-width="1.4"/></g></g>`;
}

function clock(x: number, y: number, r: number, id = '') {
  const ticks = Array.from({ length: 12 }, (_, index) => `<path d="M0 ${-r + 4} V${-r + 9}" stroke="${K}" stroke-width="2" transform="rotate(${index * 30})"/>`).join('');
  const hour = id ? ` id="${id}-hour"` : '';
  const minute = id ? ` id="${id}-minute"` : '';
  return `<g transform="translate(${x} ${y})"><circle r="${r}" fill="${V}" stroke="${C}" stroke-width="3"/>${ticks}<g${hour} style="transition:transform .8s cubic-bezier(.4,1.6,.5,1);transform:rotate(60deg)"><path d="M0 0 V${-r * 0.5}" stroke="${C}" stroke-width="3" stroke-linecap="round"/></g><g${minute} style="transition:transform .8s cubic-bezier(.4,1.6,.5,1)"><path class="school-tick" d="M0 0 V${-r * 0.78}" stroke="${K}" stroke-width="2" stroke-linecap="round"/></g><circle r="2.5" fill="${C}"/></g>`;
}

function paper(x: number, y: number, rotate: number, w = 110, h = 140) {
  const lines = Array.from({ length: Math.floor(h / 16) - 1 }, (_, index) => `<path d="M10 ${22 + index * 16} H${w - 10}" stroke="${I}" stroke-width="1.5"/>`).join('');
  return `<g transform="translate(${x} ${y}) rotate(${rotate})"><rect width="${w}" height="${h}" fill="${V}" stroke="${U}" stroke-width="1.5"/>${lines}<path d="M18 0 V${h}" stroke="${U}" stroke-width="2" opacity=".45"/></g>`;
}

function pin(x: number, y: number) {
  return `<circle cx="${x}" cy="${y}" r="6" fill="${I}" stroke="${C}" stroke-width="1.6"/>`;
}

function roof(y: number) {
  const windows = [200, 250, 460, 520, 580, 800, 860, 920, 1040, 1080].map((x) => `<rect x="${x}" y="${y + 40}" width="22" height="26" rx="2"/>`).join('');
  return `<g fill="${U}" fill-opacity=".35" stroke="${C}" stroke-opacity=".35" stroke-width="2" stroke-linejoin="round"><path d="M0 ${y + 60} H160 V${y + 20} L230 ${y - 20} L300 ${y + 20} V${y + 60} H420 V${y + 30} H640 V${y - 40} L700 ${y - 90} L760 ${y - 40} V${y + 30} H980 V${y + 10} L1060 ${y - 30} L1140 ${y + 10} V${y + 60} H1280 V800 H0 Z"/></g><g fill="${V}" fill-opacity=".8">${windows}</g>`;
}

function frame(viewBox: string, body: string, defs = '') {
  return `<svg viewBox="${viewBox}" preserveAspectRatio="xMidYMid slice" aria-hidden="true" fill="none" stroke="none"><defs>${defs}</defs>${body}</svg>`;
}

const scenes: Record<SceneName, () => string> = {
  hero: () => frame('0 0 1280 800', `<rect width="1280" height="800" fill="url(#sc-hero)"/>${cloud(0, 90, 1.4)}${cloud(300, 40, 1, 0.9, -30)}${cloud(600, 220, 1.1, 0.8, -50)}${kite(360, 120)}${bird(120, 0)}${bird(150, -6)}${plane(400, -4, 0.8)}${roof(640)}<g transform="translate(700 560)">${clock(0, 0, 26, 'school-clock')}</g><g transform="translate(700 488)"><path d="M0 0 V10" stroke="${C}" stroke-width="2"/><g class="school-swing"><path d="M-12 30 C-12 14,-8 10,0 10 C8 10,12 14,12 30 Z" fill="${I}" stroke="${C}" stroke-width="2"/></g></g>`, gradient('sc-hero', [U, I, V])),
  who: () => frame('0 0 1280 900', `<rect width="1280" height="900" fill="url(#sc-who)"/><path d="M0 0 H1280 V36 H0Z" fill="${D}" opacity=".55"/><path d="M0 36 H1280 V46 H0Z" fill="${U}" opacity=".45"/><g class="hot board"><rect width="1280" height="46" fill="transparent"/></g><path class="board-w" d="M560 26 q6 -14 12 0 q6 -14 12 0 M600 14 v14 M612 14 v14 M606 21 h6 M624 14 v14 h8 M640 14 v14 h8 M660 18 c-8 -6 -10 12 0 10 M680 12 l4 14 l4 -10 l4 10 l4 -14" fill="none" stroke="${V}" stroke-width="2" stroke-linecap="round"/>${paper(20, 180, -4, 110, 150)}${pin(75, 186)}<g transform="translate(1150 160) rotate(3)"><rect width="110" height="140" fill="${I}" stroke="${K}" stroke-width="1.5"/><text x="12" y="40" font-family="Patrick Hand" font-size="22" fill="${C}">A B C</text><text x="12" y="78" font-family="Patrick Hand" font-size="22" fill="${C}">1 2 3</text></g>${pin(1205, 166)}${clock(1205, 520, 36)}`, gradient('sc-who', [I, V])),
  day: () => frame('0 0 1280 1800', `<rect width="1280" height="1800" fill="url(#sc-day)" opacity=".55"/><circle cx="1160" cy="160" r="40" fill="${I}" stroke="${C}" stroke-width="2"/><circle cx="90" cy="900" r="36" fill="${U}" opacity=".35"/>${cloud(0, 260, 1.1)}${cloud(500, 620, 0.9, 0.8, -25)}${kite(110, 420)}${bird(330, -3)}${bird(360, -9)}${plane(760, -6)}`, gradient('sc-day', [I, V, U, D])),
  games: () => frame('0 0 1280 800', `<rect width="1280" height="800" fill="${I}" opacity=".35"/><path d="M0 30 Q320 70 640 30 T1280 30" fill="none" stroke="${K}" stroke-width="1.5"/>${Array.from({ length: 14 }, (_, index) => {
    const x = 48 + index * 88;
    const color = [I, V, U, K][index % 4];
    return `<path d="M${x} 34 l12 26 l12 -26z" fill="${color}" stroke="${K}" stroke-width="1.2" opacity=".8"/>`;
  }).join('')}${paper(30, 150, -6, 100, 120)}${pin(80, 156)}<g transform="translate(1140 140) rotate(5)"><rect width="96" height="96" fill="${V}" stroke="${K}" stroke-width="1.5"/><path d="M48 22 L55 42 L76 42 L59 54 L66 76 L48 62 L30 76 L37 54 L20 42 L41 42Z" fill="${I}" stroke="${K}" stroke-width="1.5"/></g>${pin(1188, 146)}${plane(320, -3, 0.7)}`),
  board: () => frame('0 0 1280 900', `<rect width="1280" height="900" fill="${I}" opacity=".2"/>${paper(-10, 80, -8, 120, 160)}${paper(1160, 100, 8, 120, 160)}<g transform="translate(40 430)"><rect width="70" height="28" rx="4" fill="${I}" stroke="${C}" stroke-width="2" transform="rotate(-8)"/></g><g class="hot desk"><rect x="0" y="700" width="1280" height="200" fill="transparent"/><g class="pball"><circle cx="1180" cy="820" r="16" fill="${V}" stroke="${K}" stroke-width="2"/><path d="M1170 814 l8 6 l-3 8" fill="none" stroke="${K}" stroke-width="1.5"/></g></g>`),
  learn: () => frame('0 0 1280 900', `<rect width="1280" height="900" fill="url(#sc-learn)"/>${Array.from({ length: 18 }, (_, index) => `<rect x="${24 + index * 70}" y="${78 - (24 + (index * 5) % 18)}" width="28" height="${24 + (index * 5) % 18}" fill="${[U, I, V, K][index % 4]}" stroke="${C}" stroke-width="1.4" opacity=".55"/>`).join('')}${clock(90, 210, 32)}<g transform="translate(40 700)"><rect width="100" height="16" fill="${I}" stroke="${C}" stroke-width="1.5"/><rect y="16" width="112" height="16" fill="${V}" stroke="${C}" stroke-width="1.5"/><rect y="32" width="92" height="16" fill="${U}" stroke="${C}" stroke-width="1.5" opacity=".7"/></g>`, gradient('sc-learn', [V, I])),
  safety: () => frame('0 0 1280 900', `<rect width="1280" height="900" fill="url(#sc-safety)"/><g transform="translate(1080 70)"><rect width="140" height="170" fill="${I}" stroke="${C}" stroke-width="3"/><path d="M70 0 V170 M0 85 H140" stroke="${C}" stroke-width="3"/></g>${bird(150, -4)}<g transform="translate(36 140) rotate(-8)"><circle r="42" fill="none" stroke="${K}" stroke-width="2" stroke-dasharray="4 3"/><text x="-32" y="6" font-family="Patrick Hand" font-size="18" fill="${K}">APPROVED</text></g><g transform="translate(1120 640)"><path d="M0 0 h90 v70 h-90z" fill="${I}" stroke="${C}" stroke-width="2"/><path d="M0 0 l45 34 l45 -34" fill="none" stroke="${C}" stroke-width="2"/></g>`, gradient('sc-safety', [V, I])),
  faq: () => frame('0 0 1280 900', `<rect width="1280" height="900" fill="${V}" opacity=".15"/><g fill="none" stroke="${K}" stroke-width="2" stroke-linecap="round" opacity=".4"><path d="M40 120 h80 M40 148 h80 M70 96 v80"/><path d="M1160 150 c-8 -16 -32 0 0 24 c32 -24 8 -40 0 -24z"/></g><text x="36" y="420" font-family="Patrick Hand" font-size="22" fill="${K}" opacity=".35" transform="rotate(-8 36 420)">R + S was here</text><g class="hot desk"><rect width="1280" height="900" fill="transparent"/><g class="pball"><circle cx="1188" cy="540" r="16" fill="${V}" stroke="${K}" stroke-width="2"/><path d="M1178 534 l8 5 l-3 8" fill="none" stroke="${K}" stroke-width="1.5"/></g></g>`),
  vision: () => frame('0 0 1280 800', `<rect width="1280" height="800" fill="url(#sc-vision)"/>${Array.from({ length: 18 }, (_, index) => `<circle class="school-twk" cx="${(index * 197) % 1280}" cy="${(index * 89) % 420}" r="${1 + (index % 3)}" fill="${index % 5 ? V : I}" style="animation-delay:${-index * 0.4}s"/>`).join('')}${roof(660)}${plane(180, -7, 0.6)}`, gradient('sc-vision', [C, D, K])),
  cover: () => frame('0 0 1280 500', `<rect width="1280" height="500" fill="${C}" opacity=".2"/>${Array.from({ length: 12 }, (_, index) => `<g transform="translate(${index * 106} 80)" opacity=".45"><rect width="70" height="360" fill="${index % 2 ? D : K}" stroke="${C}" stroke-width="2"/>${[0, 1, 2].map((row) => `<path d="M16 ${40 + row * 16} h38" stroke="${C}" stroke-width="2"/>`).join('')}</g>`).join('')}`),
};

export function sceneMarkup(name: SceneName) {
  return scenes[name]();
}
