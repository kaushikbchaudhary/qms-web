
export enum roles {
    SUPER_ADMIN = 'super-admin',
    SUPPORT = 'support',
    QA = 'quality-assurance',
    PRODUCTION = 'production',
    SOFTWARE = 'software',
    HARDWARE = 'hardware',
    AI_ML_TEAM = 'ai-ml-team',
    QC_TEAM = 'qc-team',
    QUALITY_ANALYST_SOFTWARE = 'quality-analyst-software',
    QA_HARDWARE = 'quality-assurance-hardware',
    ENGINEERING_MAINTENANCE = 'engineering-maintenance',
    HARDWARE_FIRMWARE_ENGINEER = 'hardware-firmware-engineer',
    REGULATORY_AFFAIRS = 'regulatory-affairs',
    STORE_INVENTORY = 'store-inventory',
    SALES_MARKETING = 'sales-marketing',
}

export const ROLE_LABELS: Record<roles, string> = {
    [roles.SUPER_ADMIN]: 'Super Admin',
    [roles.SUPPORT]: 'Support',
    [roles.QA]: 'Quality Assurance',
    [roles.PRODUCTION]: 'Production',
    [roles.SOFTWARE]: 'Software Development',
    [roles.HARDWARE]: 'Hardware',
    [roles.AI_ML_TEAM]: 'AI/ML Team',
    [roles.QC_TEAM]: 'Quality Control',
    [roles.QUALITY_ANALYST_SOFTWARE]: 'Quality Analyst (Software)',
    [roles.QA_HARDWARE]: 'Quality Assurance (Hardware)',
    [roles.ENGINEERING_MAINTENANCE]: 'Engineering & Maintenance',
    [roles.HARDWARE_FIRMWARE_ENGINEER]: 'Hardware & Firmware Engineer',
    [roles.REGULATORY_AFFAIRS]: 'Regulatory Affairs',
    [roles.STORE_INVENTORY]: 'Store & Inventory',
    [roles.SALES_MARKETING]: 'Sales & Marketing',
};

export const formatRoleLabel = (value?: string | null): string => {
    if (!value) return '';
    return ROLE_LABELS[value as roles] ??
        value
            .replace(/[-_]/g, ' ')
            .replace(/\b\w/g, (char) => char.toUpperCase());
};

export const ROLE_ACCESS = {
    [roles.SUPER_ADMIN]: {
        routes: [
            '/admin/dashboard',
            '/admin/settings',
            '/profile',
            '/admin/users',
            '/admin/users/edit-user/[id]',
            '/dashboard/complaints',
            '/dashboard/complaints/[id]',
            '/dashboard/device-material-issues',
            '/dashboard/device-material-issues/[id]',
            '/dashboard/device-material-issues/new'
        ],
        redirect: '/admin/dashboard'
    },
    [roles.SUPPORT]: {
        routes: [
            '/',
            '/dashboard',
            '/profile',
            '/dashboard/complaints',
            '/dashboard/complaints/new',
            '/dashboard/complaints/[id]',
            '/dashboard/device-material-issues',
            '/dashboard/device-material-issues/new',
            '/dashboard/device-material-issues/[id]'
        ],
        redirect: '/dashboard/complaints'
    },
    [roles.QA]: {
        routes: [
            '/profile',
            '/dashboard/complaints',
            '/dashboard/complaints/new',
            '/dashboard/complaints/[id]',
            '/dashboard/device-material-issues',
            '/dashboard/device-material-issues/[id]'
        ],
        redirect: '/dashboard/complaints'
    },
    [roles.PRODUCTION]: {
        routes: [
            '/',
            '/profile',
            '/dashboard/complaints',
            '/dashboard/complaints/new',
            '/dashboard/complaints/[id]',
            '/dashboard/device-material-issues',
            '/dashboard/device-material-issues/[id]'
        ],
        redirect: '/'
    },
    [roles.SOFTWARE]: {
        routes: [
            '/',
            '/profile',
            '/dashboard/complaints',
            '/dashboard/complaints/new',
            '/dashboard/complaints/[id]',
            '/dashboard/device-material-issues',
            '/dashboard/device-material-issues/[id]'
        ],
        redirect: '/'
    },
    [roles.HARDWARE]: {
        routes: [
            '/',
            '/profile',
            '/dashboard/complaints',
            '/dashboard/complaints/new',
            '/dashboard/complaints/[id]',
            '/dashboard/device-material-issues',
            '/dashboard/device-material-issues/[id]'
        ],
        redirect: '/'
    },
    [roles.AI_ML_TEAM]: {
        routes: [
            '/',
            '/profile',
            '/dashboard/complaints',
            '/dashboard/complaints/new',
            '/dashboard/complaints/[id]',
            '/dashboard/device-material-issues',
            '/dashboard/device-material-issues/[id]'
        ],
        redirect: '/'
    },
    [roles.QC_TEAM]: {
        routes: [
            '/',
            '/profile',
            '/dashboard/complaints',
            '/dashboard/complaints/new',
            '/dashboard/complaints/[id]',
            '/dashboard/device-material-issues',
            '/dashboard/device-material-issues/[id]'
        ],
        redirect: '/'
    },
    [roles.QUALITY_ANALYST_SOFTWARE]: {
        routes: [
            '/staff',
            '/profile',
            '/dashboard/complaints',
            '/dashboard/complaints/new',
            '/dashboard/complaints/[id]',
            '/dashboard/device-material-issues',
            '/dashboard/device-material-issues/[id]'
        ],
        redirect: '/dashboard/complaints'
    },
    [roles.QA_HARDWARE]: {
        routes: [
            '/staff',
            '/profile',
            '/dashboard/complaints',
            '/dashboard/complaints/new',
            '/dashboard/complaints/[id]',
            '/dashboard/device-material-issues',
            '/dashboard/device-material-issues/[id]'
        ],
        redirect: '/dashboard/complaints'
    },
    [roles.ENGINEERING_MAINTENANCE]: {
        routes: [
            '/',
            '/profile',
            '/dashboard/complaints',
            '/dashboard/complaints/new',
            '/dashboard/complaints/[id]',
            '/dashboard/device-material-issues',
            '/dashboard/device-material-issues/[id]'
        ],
        redirect: '/'
    },
    [roles.HARDWARE_FIRMWARE_ENGINEER]: {
        routes: [
            '/',
            '/profile',
            '/dashboard/complaints',
            '/dashboard/complaints/new',
            '/dashboard/complaints/[id]',
            '/dashboard/device-material-issues',
            '/dashboard/device-material-issues/[id]'
        ],
        redirect: '/'
    },
    [roles.REGULATORY_AFFAIRS]: {
        routes: [
            '/staff',
            '/profile',
            '/dashboard/complaints',
            '/dashboard/complaints/new',
            '/dashboard/complaints/[id]',
            '/dashboard/device-material-issues',
            '/dashboard/device-material-issues/[id]'
        ],
        redirect: '/dashboard/complaints'
    },
    [roles.STORE_INVENTORY]: {
        routes: [
            '/',
            '/profile',
            '/dashboard/complaints',
            '/dashboard/complaints/new',
            '/dashboard/complaints/[id]',
            '/dashboard/device-material-issues',
            '/dashboard/device-material-issues/[id]'
        ],
        redirect: '/'
    },
    [roles.SALES_MARKETING]: {
        routes: [
            '/',
            '/dashboard',
            '/profile',
            '/dashboard/complaints',
            '/dashboard/complaints/new',
            '/dashboard/complaints/[id]',
            '/dashboard/device-material-issues',
            '/dashboard/device-material-issues/new',
            '/dashboard/device-material-issues/[id]'
        ],
        redirect: '/dashboard/complaints'
    },
} as const;

export type UserRole = keyof typeof ROLE_ACCESS;
