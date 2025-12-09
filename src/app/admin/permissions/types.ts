export type PermissionRecord = {
  key: string;
  description?: string;
};

export type PermissionMatrixResponse = {
  permissions: PermissionRecord[];
  role_permissions_map: Record<string, string[]>;
};
