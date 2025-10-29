import { ROLE_ACCESS, UserRole, roles } from '@/config/roles';

const ROLE_SYNONYMS: Record<string, UserRole> = {
  'store & inventory': roles.STORE_INVENTORY,
};

export const resolveRoleKey = (role: string): UserRole | undefined => {
  if (!role) {
    return undefined;
  }
  if (ROLE_ACCESS[role as UserRole]) {
    return role as UserRole;
  }
  const normalized = role.trim().toLowerCase();
  return ROLE_SYNONYMS[normalized] ?? undefined;
};

export function hasAccess(pathname: string, userRoles: string[]): boolean {
  return userRoles.some((role) => {
    const resolvedRole = resolveRoleKey(role);
    if (!resolvedRole) {
      return false;
    }
    const allowedRoutes = ROLE_ACCESS[resolvedRole]?.routes || [];
    return allowedRoutes.some((route) => {
      const routePattern = route
        .replace(/\[([^\]]+)\]/g, '[^/]+')
        .replace(/\//g, '\\/');

      const regex = new RegExp(`^${routePattern}$`);
      return regex.test(pathname);
    });
  });
}

export function getRedirectPath(userRoles: string[]): string {
  for (const role of userRoles) {
    const resolvedRole = resolveRoleKey(role);
    if (resolvedRole && ROLE_ACCESS[resolvedRole]?.redirect) {
      return ROLE_ACCESS[resolvedRole].redirect;
    }
  }
  return '/';
}
