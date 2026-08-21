import type { RoleId } from '@/types/content';

const supportedRoles = new Set<RoleId>([
  'aiml',
  'software',
  'android',
  'teaching',
]);

export function roleFromSearchParams(searchParams: URLSearchParams): RoleId {
  const role = searchParams.get('role');
  return supportedRoles.has(role as RoleId) ? (role as RoleId) : 'aiml';
}

export function roleHref(role: RoleId) {
  return `/?role=${role}`;
}
