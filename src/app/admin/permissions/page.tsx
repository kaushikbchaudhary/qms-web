"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { roles } from '@/config/roles';
import { PermissionMatrix } from './components/PermissionMatrix';
import {
  createPermission,
  exportPermissionMap,
  fetchPermissionMatrix,
  importPermissionMap,
  updateRolePermissions,
} from './api';
import { PermissionMatrixResponse } from './types';
import { can as buildCan } from '@/lib/auth/permissions';
import { toast } from 'sonner';

export default function PermissionAdminPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const can = useMemo(() => buildCan(user), [user]);

  const [data, setData] = useState<PermissionMatrixResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const allowed =
      can('site_config.update', () => user?.role?.includes(roles.SUPER_ADMIN) ?? false);
    if (!allowed) {
      router.push('/admin/dashboard');
      return;
    }
    let mounted = true;
    fetchPermissionMatrix()
      .then((payload) => {
        if (mounted) setData(payload);
      })
      .catch(() => {
        if (mounted) toast.error('Failed to load permissions');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [router, user?.role, can]);

  const handleToggle = async (role: string, permission: string, next: boolean) => {
    if (!data) return;
    const current = data.role_permissions_map[role] ?? [];
    const nextSet = new Set(current);
    if (next) {
      nextSet.add(permission);
    } else {
      nextSet.delete(permission);
    }
    const nextArr = Array.from(nextSet);
    await updateRolePermissions(role, nextArr);
    setData({
      ...data,
      role_permissions_map: { ...data.role_permissions_map, [role]: nextArr },
    });
    toast.success('Updated role permissions');
  };

  const handleAddPermission = async (key: string, description?: string) => {
    await createPermission(key, description);
    const refreshed = await fetchPermissionMatrix();
    setData(refreshed);
    toast.success('Permission added');
  };

  const handleImport = async (map: Record<string, string[]>) => {
    await importPermissionMap(map);
    const refreshed = await fetchPermissionMatrix();
    setData(refreshed);
    toast.success('Permissions imported');
  };

  const handleExport = async () => {
    return exportPermissionMap();
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading permissions…
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-sm text-muted-foreground">
        Failed to load permission data.
      </div>
    );
  }

  return (
    <div className="container max-w-6xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>Permission Matrix</CardTitle>
          <CardDescription>
            Toggle permissions per role. Changes apply immediately and keep legacy role logic intact.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PermissionMatrix
            permissions={data.permissions}
            rolePermissions={data.role_permissions_map}
            onToggle={handleToggle}
            onAddPermission={handleAddPermission}
            onImport={handleImport}
            onExport={handleExport}
          />
        </CardContent>
      </Card>
      <div className="mt-6 flex justify-end">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          Back
        </Button>
      </div>
    </div>
  );
}
