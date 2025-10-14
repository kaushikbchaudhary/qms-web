
export enum roles {
    SUPER_ADMIN = 'super-admin',
    SUPPORT = 'support',
    QA = 'qa',
    PRODUCTION = 'production',
    SOFTWARE = 'software',
    HARDWARE = 'hardware',
    AI_ML_TEAM = 'ai/ml team',
    QC_TEAM = 'qc team',
}

export const ROLE_ACCESS = {
    [roles.SUPER_ADMIN]: {
        routes: ['/admin/dashboard','/admin/settings','/profile', '/admin/users', '/admin/users/edit-user/[id]','/dashboard/complaints','/dashboard/complaints/[id]'],
        redirect: '/admin/dashboard'
    },
    [roles.SUPPORT]: {
        routes: ['/', '/dashboard','/profile', '/dashboard/complaints', '/dashboard/complaints/new','/dashboard/complaints/[id]'],
        redirect: '/dashboard/complaints'
    },
    [roles.QA]: {
        routes: ['/staff','/profile', '/staff/patients','/dashboard/complaints', '/dashboard/complaints/new','/dashboard/complaints/[id]'],
        redirect: '/staff/patients'
    },
    [roles.PRODUCTION]: {
        routes: ['/', '/profile','/dashboard/complaints', '/dashboard/complaints/new','/dashboard/complaints/[id]'],
        redirect: '/'
    },
    [roles.SOFTWARE]: {
        routes: ['/', '/profile','/dashboard/complaints', '/dashboard/complaints/new','/dashboard/complaints/[id]'],
        redirect: '/'
    },
    [roles.HARDWARE]: {
        routes: ['/', '/profile','/dashboard/complaints', '/dashboard/complaints/new','/dashboard/complaints/[id]'],
        redirect: '/'
    },
    [roles.AI_ML_TEAM]: {
        routes: ['/', '/profile','/dashboard/complaints', '/dashboard/complaints/new','/dashboard/complaints/[id]'],
        redirect: '/'
    },
    [roles.QC_TEAM]: {
        routes: ['/', '/profile','/dashboard/complaints', '/dashboard/complaints/new','/dashboard/complaints/[id]'],
        redirect: '/'
    },
} as const;

export type UserRole = keyof typeof ROLE_ACCESS;
