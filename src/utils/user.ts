import { User } from 'firebase/auth';
import { UserProfile } from '../types/user';

const GENERIC_DISPLAY_NAMES = new Set(['Estudante', 'Usuário', 'Professor(a)']);

export function isGenericDisplayName(name?: string | null): boolean {
  const trimmed = name?.trim();
  return !trimmed || GENERIC_DISPLAY_NAMES.has(trimmed);
}

export function resolveDisplayName(
  profile?: Pick<UserProfile, 'displayName'> | null,
  user?: User | null,
  fallback = 'Estudante',
): string {
  if (profile?.displayName?.trim()) {
    return profile.displayName.trim();
  }

  if (user?.displayName?.trim()) {
    return user.displayName.trim();
  }

  if (user?.email) {
    return user.email.split('@')[0];
  }

  if (!isGenericDisplayName(fallback)) {
    return fallback.trim();
  }

  return fallback.trim() || 'Estudante';
}
