import { useQuery } from '@tanstack/react-query';
import { userApi } from '@/lib/api/endpoints/users';

export interface BasicUser {
  _id: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  role?: string[];
  signature?: {
    path?: string;
    filename?: string;
    uploadedAt?: string;
  };
}

const buildName = (user?: BasicUser) => {
  if (!user) return '';
  const parts = [user.firstName, user.middleName, user.lastName].filter(Boolean);
  return parts.join(' ').trim() || user._id;
};

export const useUsersByRole = (roles: string[]) =>
  useQuery({
    queryKey: ['users-by-role', roles.sort().join(',')],
    queryFn: async () => {
      const response: any = await userApi.getUsers({
        filters: [
          {
            field: 'role',
            operator: 'in',
            value: roles,
          },
        ],
        page_size: 100,
        page_index: 1,
      });
      const payload = response?.data ?? response;
      const list: BasicUser[] = Array.isArray(payload?.list) ? payload.list : [];

      return list.map((user) => ({
        ...user,
        displayName: buildName(user),
      })) as (BasicUser & { displayName: string })[];
    },
  });
