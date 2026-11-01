export function scrubPii(text: string, names: readonly string[] = []): string {
  let clean = text.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email]')
    .replace(/(?:\+?\d[\s().-]*){10,15}/g, '[phone]');
  for (const name of names.filter((entry) => entry.trim().length > 1).sort((a, b) => b.length - a.length)) {
    clean = clean.replace(new RegExp(`(?<![\\p{L}])${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}])`, 'giu'), '[name]');
  }
  return clean;
}
export function detectLanguage(text: string): 'hi' | 'hinglish' | 'en' {
  const letters = text.match(/\p{L}/gu) ?? [];
  if (letters.length && (text.match(/\p{Script=Devanagari}/gu)?.length ?? 0) / letters.length >= 0.3) return 'hi';
  return (text.toLowerCase().match(/\b(kyun|kya|hai|nahi|matlab|samjha|kaise)\b/g)?.length ?? 0) >= 2 ? 'hinglish' : 'en';
}
export function depthProfile(band: number, levels: readonly number[]): 'analogy_first' | 'standard' | 'formula_forward' {
  return band <= 25 || levels.includes(1) ? 'analogy_first' : band >= 75 ? 'formula_forward' : 'standard';
}
export function needsClarification(text: string, matches: readonly number[]): boolean {
  return (!matches.length && (text.match(/\p{L}+/gu)?.length ?? 0) < 4)
    || (matches.length > 1 && matches[0]! > 0 && Math.abs(matches[0]! - matches[1]!) / matches[0]! <= 0.1);
}
export function injectionScreen(text: string): boolean {
  return /ignore.{0,40}(instructions|rules|prompt)|system\s*prompt|you are now|developer\s*message|reveal.{0,30}(secret|key)/i.test(text);
}
export function subtagFor(_conceptId: string, text: string, recentErrorTypes: readonly string[] = []): string {
  if (/sign|negative|decelerat|retardat/i.test(text)) return 'sign_convention';
  if (/graph|slope|area/i.test(text)) return 'graph_reading';
  if (/average|mean/i.test(text)) return 'avg_speed_mean';
  return recentErrorTypes[0] ?? 'concept_question';
}
export function toneGuard(text: string): string {
  return text.replace(/[\p{Extended_Pictographic}\p{Regional_Indicator}\u200d\ufe0f\u20e3]/gu, '')
    .replace(/\b(stupid|obviously|easy|you should know|wrong again)\b/gi, '')
    .replace(/\b(?:LV|Lvl|L)\s*\d+\b/gi, '').trim();
}
export function homeworkMatches(question: string, stem: string): boolean {
  const words = (value: string) => new Set(value.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []);
  const a = words(question), b = words(stem);
  const union = new Set([...a, ...b]);
  return union.size > 0 && [...a].filter((word) => b.has(word)).length / union.size >= 0.6;
}
export const HOMEWORK_HINT = 'What is given, and which formula links it to what is asked?';
export const UNSURE_COPY = "I'm not sure about this one. Could you ask your teacher to check it with you?";
export function guardAnswer(text: string, chunkIds: readonly number[], homework: boolean) {
  const invalidCitation = [...text.matchAll(/\[chunk:(\d+)\]/g)].some((match) => !chunkIds.includes(Number(match[1])));
  const unsure = invalidCitation || /not sure|do not know|don't know/i.test(text);
  // Homework always stays on the hint ladder, even if the provider hides a result in prose.
  const safe = homework ? HOMEWORK_HINT : unsure ? UNSURE_COPY : toneGuard(text);
  return { text: safe || UNSURE_COPY, flags: { homeworkGuard: homework, honestUnsure: unsure || !safe, clarifying: false } };
}
