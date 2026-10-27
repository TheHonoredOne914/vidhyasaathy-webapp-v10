export type Audience = 'admin' | 'teacher' | 'student';

export function audienceFrom(pathname: string): Audience {
  if (pathname === '/admin' || pathname.startsWith('/admin/')) return 'admin';
  if (pathname === '/student' || pathname.startsWith('/student/')) return 'student';
  return 'teacher';
}
