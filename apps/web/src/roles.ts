import type { Role } from '@vidhyasaathy/contracts';

export const ROLE_HOME: Record<Role, string> = {
  admin: '/admin',
  teacher: '/teacher',
  student: '/student',
  parent: '/parent',
};

export const ROLE_NOUN: Record<Role, string> = {
  admin: 'administrator',
  teacher: 'teacher',
  student: 'student',
  parent: 'parent',
};
