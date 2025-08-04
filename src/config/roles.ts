
export enum roles {
    SUPER_ADMIN = 'super-admin',
    SUPPORT = 'support',
    QA = 'qa',
    PRODUCTION = 'production',
}

export const ROLE_ACCESS = {
    [roles.SUPER_ADMIN]: {
        routes: ['/admin/users', '/admin/users/edit-user/[id]','/dashboard/complaints','/dashboard/complaints/[id]'],
        redirect: '/admin/users'
    },
    [roles.SUPPORT]: {
        routes: ['/', '/dashboard', '/dashboard/complaints', '/dashboard/complaints/new','/dashboard/complaints/[id]'],
        redirect: '/dashboard/complaints'
    },
    [roles.QA]: {
        routes: ['/staff'],
        redirect: '/staff/patients'
    },
    [roles.PRODUCTION]: {
        routes: ['/profile'],
        redirect: '/'
    }
} as const;

export type UserRole = keyof typeof ROLE_ACCESS;