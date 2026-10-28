import type { SourceChunk } from './provider.ts';

// Words that shape a question without saying what it is about.
const QUESTION_WORDS = new Set([
  'what', 'which', 'when', 'where', 'who', 'whom', 'whose', 'does', 'did', 'have', 'has', 'had', 'with', 'from', 'this', 'that',
  'these', 'those', 'your', 'please', 'explain', 'about', 'the', 'and', 'how', 'why', 'are', 'can', 'for', 'was', 'were', 'will',
  'would', 'should', 'could', 'into', 'than', 'then', 'also', 'just', 'some', 'more', 'most', 'very', 'much', 'many', 'like',
  'difference', 'differences', 'differ', 'different', 'between', 'compare', 'versus', 'define', 'definition', 'meaning', 'mean',
  'means', 'tell', 'give', 'describe', 'example', 'examples', 'know', 'understand', 'notes', 'note', 'saathy', 'whats', 'its',
  'they', 'them', 'there', 'their', 'our', 'you', 'not', 'any', 'all', 'one', 'use', 'used', 'kind', 'type', 'called', 'term',
]);
const MIN_COVERAGE = 0.6;

function words(text: string) {
  return (text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []).map((word) => (word.length > 4 && word.endsWith('s') && !word.endsWith('ss') ? word.slice(0, -1) : word));
}
const same = (a: string, b: string) => a === b || (a.length >= 6 && b.length >= 6 && a.slice(0, 6) === b.slice(0, 6) && (a.startsWith(b) || b.startsWith(a) || a.slice(0, 8) === b.slice(0, 8)));

export interface ExtractedAnswer { message: string; quotes: { source: SourceChunk; quote: string }[] }

/**
 * Notes-only answer used when no AI provider is configured: it quotes the released note sentences
 * that cover the question's subject words, and refuses when the notes do not cover most of them.
 */
export function extractAnswer(question: string, sources: SourceChunk[], hintLevel: number, socratic: boolean): ExtractedAnswer | null {
  const terms = [...new Set(words(question).filter((word) => word.length > 2 && !QUESTION_WORDS.has(word)))];
  if (!terms.length) return null;
  const sentences = sources.flatMap((source) => source.text.split(/(?<=[.!?])\s+/).map((quote, order) => {
    const text = words(quote);
    const covered = terms.filter((term) => text.some((word) => same(word, term)));
    return { source, quote: quote.trim(), order, covered };
  })).filter((sentence) => sentence.quote.length > 0 && sentence.covered.length > 0);
  const ranked = [...sentences].sort((a, b) => b.covered.length - a.covered.length || a.order - b.order);
  const picked = ranked.slice(0, socratic ? 1 : Math.min(4, hintLevel + 1));
  const covered = new Set(picked.flatMap((sentence) => sentence.covered));
  if (!picked.length || covered.size / terms.length < MIN_COVERAGE) return null;
  const quotes = picked.sort((a, b) => sources.indexOf(a.source) - sources.indexOf(b.source) || a.order - b.order)
    .map(({ source, quote }) => ({ source, quote }));
  const message = socratic
    ? `Your notes say: "${quotes[0]!.quote}" Using that line, how would you answer your question in your own words?`
    : `From your notes: ${quotes.map((entry) => entry.quote).join(' ')}`;
  return { message, quotes };
}
