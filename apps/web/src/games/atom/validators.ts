import type { CheckpointAnswer, Feedback } from '../engine/types';

export function massNumber(protons: number, neutrons: number): number {
  return protons + neutrons;
}

export function isotopeName(element: string, protons: number, neutrons: number): string {
  return `${element}-${massNumber(protons, neutrons)}`;
}

export function isotopeStability(protons: number, neutrons: number): 'stable' | 'borderline' | 'radioactive' {
  const ratio = neutrons / Math.max(1, protons);
  if (protons === 6) return neutrons === 6 || neutrons === 7 ? 'stable' : 'radioactive';
  if (ratio > 1.5 || ratio < 0.8) return 'radioactive';
  return 'borderline';
}

export const alphaModel = (answer: CheckpointAnswer): Feedback => answer === 'rutherford'
  ? { correct: true, feedback: 'Correct. Most alpha particles pass through empty space; a few deflect near the tiny, dense nucleus. Rutherford explains both observations.' }
  : { correct: false, feedback: 'Thomson had no small, dense nucleus. The rare deflections reveal a concentrated positive nucleus, while the straight paths reveal mostly empty space.' };

export const atomBuild = (answer: CheckpointAnswer): Feedback => {
  if (!answer || Array.isArray(answer) || typeof answer !== 'object') return { correct: false, feedback: 'Place protons and neutrons in the nucleus, then fill K, L and M.' };
  const values = answer as Record<string, string>;
  const shellCounts = ['k', 'l', 'm'].map((shell) => Object.values(values).filter((target) => target === shell).length);
  const nucleusCount = Object.values(values).filter((target) => target === 'nucleus').length;
  return shellCounts.join(',') === '2,8,1' && nucleusCount === 23
    ? { correct: true, feedback: 'Sodium is built: 11 protons set Z = 11, 12 neutrons make A = 23, and 2,8,1 gives valency 1.' }
    : { correct: false, feedback: 'Build sodium: 11 protons + 12 neutrons in the nucleus; electrons must be 2 in K, 8 in L and 1 in M.' };
};

export const isotopeSort = (answer: CheckpointAnswer): Feedback => {
  if (!answer || Array.isArray(answer) || typeof answer !== 'object') return { correct: false, feedback: 'Drag every atom into an isotope or isobar bin.' };
  const values = answer as Record<string, string>;
  return values.ca40 === 'isobar' && values.ar40 === 'isobar' && values.c12 === 'isotope' && values.c14 === 'isotope'
    ? { correct: true, feedback: 'Exactly. Isobars share mass number A; isotopes share atomic number Z.' }
    : { correct: false, feedback: 'Compare the labels: Ca-40 and Ar-40 share A, while C-12 and C-14 share Z.' };
};

export const conceptQuiz = (answer: CheckpointAnswer): Feedback => {
  if (!answer || Array.isArray(answer) || typeof answer !== 'object') return { correct: false, feedback: 'Answer all three questions.' };
  const values = answer as Record<string, string>;
  return values.q1 === 'protons' && values.q2 === 'fourteen' && values.q3 === 'isotopes'
    ? { correct: true, feedback: 'Brilliant recall: protons set Z, A is protons plus neutrons, and same-Z atoms with different A are isotopes.' }
    : { correct: false, feedback: 'Remember: Z counts protons, A = protons + neutrons, and same Z with different A means isotopes.' };
};

export const alphaPath = alphaModel;
export const shellPlacement = atomBuild;
export const isotopeOrder = isotopeSort;
export const combCharge = (answer: CheckpointAnswer): Feedback => answer === 'negative' ? { correct: true, feedback: 'Extra electrons make the comb negative.' } : { correct: false, feedback: 'The comb gains electrons, so it becomes negative.' };
export const electronCharge = (answer: CheckpointAnswer): Feedback => answer === 'negative' ? { correct: true, feedback: 'An electron has charge minus one.' } : { correct: false, feedback: 'An electron is negatively charged.' };
export const neutronCount = (answer: CheckpointAnswer): Feedback => answer === 8 ? { correct: true, feedback: 'Z stays 6; A becomes 14.' } : { correct: false, feedback: 'Set the neutron count to eight.' };
export const oxygenAtomicity = (answer: CheckpointAnswer): Feedback => answer === 2 ? { correct: true, feedback: 'O₂ contains two oxygen atoms.' } : { correct: false, feedback: 'The subscript 2 counts the atoms.' };
export const valency = (expected: number, element: string) => (answer: CheckpointAnswer): Feedback => answer === expected ? { correct: true, feedback: `${element} has valency ${expected}.` } : { correct: false, feedback: `${element} has valency ${expected}.` };
