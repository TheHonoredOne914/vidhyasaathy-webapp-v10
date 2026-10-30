export type XpKind = 'answer' | 'session_completed' | 'daily_challenge_completed';

export interface XpRow {
  kind: XpKind;
  correct?: boolean;
  confidence?: 'sure' | 'unsure' | 'guess';
}

const ANSWER_XP = 10;
const GUESS_XP = 3;
const SESSION_XP = 20;
const CHALLENGE_XP = 15;

/** Points from evidence. There is no stored level and no comparison with anyone else. */
export function xpFromEvidence(rows: readonly XpRow[]) {
  let xp = 0;
  for (const row of rows) {
    if (row.kind === 'session_completed') xp += SESSION_XP;
    else if (row.kind === 'daily_challenge_completed') xp += CHALLENGE_XP;
    else if (row.correct && row.confidence === 'guess') xp += GUESS_XP;
    else if (row.correct) xp += ANSWER_XP;
  }
  return xp;
}
