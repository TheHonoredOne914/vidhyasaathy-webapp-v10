const EYES: Record<string, string> = {
  happy: '<path class="face" d="M45 50q4-5 8 0"/><path class="face" d="M67 50q4-5 8 0"/><path class="face" d="M54 60q6 5 12 0"/>',
  think: '<circle cx="49" cy="50" r="2.6" fill="#1B2A4A"/><circle cx="71" cy="50" r="2.6" fill="#1B2A4A"/><path class="face" d="M55 61q5-2 10 0"/>',
  cheer: '<path class="face" d="M45 50q4-5 8 0"/><path class="face" d="M67 50q4-5 8 0"/><path d="M53 58q7 9 14 0z" fill="#1B2A4A"/>',
  oops: '<circle cx="49" cy="50" r="2.6" fill="#1B2A4A"/><circle cx="71" cy="50" r="2.6" fill="#1B2A4A"/><path class="face" d="M55 62q5-4 10 0"/><path class="face" d="M84 30q3 4 0 7"/>',
  sleep: '<path class="face" d="M45 49q4 4 8 0"/><path class="face" d="M67 49q4 4 8 0"/><path class="face" d="M56 60q4 3 8 0"/>',
};

const BODY = '<path class="body" d="M30 76C15 76 8 63 15 53C8 42 18 29 31 32C34 18 52 11 63 21C73 11 93 16 95 32C108 33 115 48 107 58C111 69 102 77 92 76Z"/><path class="shade" d="M22 64q4 6 12 6"/><path class="shade" d="M98 40q5 3 5 9"/><ellipse class="blush" cx="40" cy="59" rx="5.5" ry="3.2"/><ellipse class="blush" cx="80" cy="59" rx="5.5" ry="3.2"/>';

export type SaathyMood = 'happy' | 'think' | 'cheer' | 'oops' | 'sleep';

export function Saathy({ mood = 'happy', size = '5rem', label = 'Saathy', className = '' }: { mood?: SaathyMood; size?: string | number; label?: string; className?: string }) {
  const width = typeof size === 'number' ? `${size}px` : size;
  return <svg className={className ? `nb-saathy ${className}` : 'nb-saathy'} viewBox="0 0 120 90" style={{ width, height: 'auto' }} role="img" aria-label={label} dangerouslySetInnerHTML={{ __html: `${BODY}${EYES[mood] ?? EYES.happy}` }} />;
}
