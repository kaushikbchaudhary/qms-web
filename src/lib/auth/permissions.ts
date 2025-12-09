import { UserData } from '@/stores/authStore';

export const hasPermission = (user: Pick<UserData, 'permissions' | 'role'> | null | undefined, key: string): boolean => {
  const permissionSet = new Set(user?.permissions ?? []);
  if (permissionSet.has(key)) return true;
  return false;
};

export const can =
  (user: Pick<UserData, 'permissions' | 'role'> | null | undefined) =>
  (key: string, fallback?: () => boolean) => {
    if (hasPermission(user, key)) return true;
    return typeof fallback === 'function' ? fallback() : false;
  };
