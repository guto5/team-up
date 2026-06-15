import { UserRole } from '../types/user';

export function getRoleFromEmail(email: string | null | undefined): UserRole {
  if (!email) return 'student';

  const lower = email.toLowerCase();
  if (lower.includes('@universo.univates')) return 'student';
  if (lower.includes('@univates')) return 'teacher';

  return 'student';
}

export function isTeacherEmail(email: string | null | undefined): boolean {
  return getRoleFromEmail(email) === 'teacher';
}
