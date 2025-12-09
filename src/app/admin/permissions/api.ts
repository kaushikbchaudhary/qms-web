import { apiClient } from '@/lib/api/client';
import { PermissionMatrixResponse } from './types';

export const fetchPermissionMatrix = async (): Promise<PermissionMatrixResponse> => {
  const res = await apiClient.get('/api/v1/permissions/matrix');
  return (res as any)?.data as PermissionMatrixResponse;
};

export const updateRolePermissions = async (role: string, permissions: string[]) => {
  await apiClient.post('/api/v1/permissions/assign', { role, permissions });
};

export const createPermission = async (key: string, description?: string) => {
  await apiClient.post('/api/v1/permissions', { key, description });
};

export const importPermissionMap = async (role_permissions_map: Record<string, string[]>) => {
  await apiClient.post('/api/v1/permissions/import', { role_permissions_map });
};

export const exportPermissionMap = async (): Promise<Record<string, string[]>> => {
  const res = await apiClient.get('/api/v1/permissions/export');
  return ((res as any)?.data?.role_permissions_map ?? {}) as Record<string, string[]>;
};
