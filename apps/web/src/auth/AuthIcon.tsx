type IconName = 'arrow' | 'back' | 'book' | 'student' | 'teacher' | 'parent' | 'school' | 'mail' | 'lock' | 'user' | 'pin' | 'phone' | 'shield' | 'check' | 'spark' | 'key';

const marks: Record<IconName, string> = {
  arrow: 'M4 12 H20 M14 6 L20 12 L14 18',
  back: 'M20 12 H4 M10 6 L4 12 L10 18',
  book: 'M3 5 C7 3,10 4,12 6 C14 4,17 3,21 5 V19 C17 17,14 18,12 20 C10 18,7 17,3 19 Z M12 6 V20',
  student: 'M2 9 L12 4 L22 9 L12 14 Z M6 11 V16 C9 19,15 19,18 16 V11',
  teacher: 'M3 4 H21 V16 H3 Z M8 20 L12 16 L16 20 M7 9 H13',
  parent: 'M8 4 a3 3 0 1 1 0 6 a3 3 0 1 1 0 -6 M17 7 a2 2 0 1 1 0 4 a2 2 0 1 1 0 -4 M2 20 C3 13,13 13,14 20 M14 20 C15 15,20 15,21 20',
  school: 'M3 20 V9 L12 3 L21 9 V20 Z M9 20 V14 H15 V20',
  mail: 'M3 5 H21 V19 H3 Z M3 6 L12 13 L21 6',
  lock: 'M5 10 H19 V20 H5 Z M8 10 V7 C8 2,16 2,16 7 V10',
  user: 'M12 5 a3 3 0 1 1 0 6 a3 3 0 1 1 0 -6 M5 20 C6 14,18 14,19 20',
  pin: 'M12 21 C6 14,5 11,5 9 A7 7 0 1 1 19 9 C19 11,18 14,12 21 Z M12 7 a2 2 0 1 1 0 4 a2 2 0 1 1 0 -4',
  phone: 'M7 2 H17 V22 H7 Z M11 18 H13',
  shield: 'M12 3 L20 6 V12 C20 17,16 20,12 21 C8 20,4 17,4 12 V6 Z',
  check: 'M5 12 L10 17 L19 7',
  spark: 'M12 3 L14 9 L21 9 L15 13 L17 20 L12 16 L7 20 L9 13 L3 9 L10 9 Z',
  key: 'M7 8 a4 4 0 1 1 0 8 a4 4 0 1 1 0 -8 M11 12 H21 M17 12 V16 M20 12 V15',
};

export function AuthIcon({ name, size = 20 }: { name: IconName; size?: number }) {
  return <svg className="auth-icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={marks[name]} /></svg>;
}
