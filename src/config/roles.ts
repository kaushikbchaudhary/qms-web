export enum roles {
    SUPER_ADMIN = 'super-admin',
    SUPPORT = 'support',
    QA = 'quality-assurance',
    PRODUCTION = 'production',
    SOFTWARE = 'software',
    DESIGN_DEVELOPMENT = 'design-development',
    DEVOPS = 'devops',
    CLINICAL_RESEARCH = 'clinical-research',
    AI_ML_TEAM = 'ai-ml-team',
    QC_TEAM = 'qc-team',
    QUALITY_ANALYST_SOFTWARE = 'quality-analyst-software',
    QA_HARDWARE = 'quality-assurance-hardware',
    ENGINEERING_MAINTENANCE = 'engineering-maintenance',
    EMBEDDED_HARDWARE_FIRMWARE = 'embedded-hardware-firmware',
    REGULATORY_AFFAIRS = 'regulatory-affairs',
    STORE_INVENTORY = 'store-inventory',
    SALES_MARKETING = 'sales-marketing',
}

export const allRoles = Object.values(roles);



export const isValidRole = (value: string): value is roles => {
    return allRoles.includes(value as roles);
};

export type UserRole = roles;

export const ROLE_LABELS: Record<roles, string> = {
    [roles.SUPER_ADMIN]: 'Super Admin',
    [roles.SUPPORT]: 'Support',
    [roles.QA]: 'Quality Assurance',
    [roles.PRODUCTION]: 'Production',
    [roles.SOFTWARE]: 'Software Development',
    [roles.DESIGN_DEVELOPMENT]: 'Design & Development Department',
    [roles.DEVOPS]: 'DevOps Department',
    [roles.CLINICAL_RESEARCH]: 'Clinical Research Department',
    [roles.AI_ML_TEAM]: 'AI/ML Team',
    [roles.QC_TEAM]: 'Quality Control',
    [roles.QUALITY_ANALYST_SOFTWARE]: 'Quality Analyst (Software)',
    [roles.QA_HARDWARE]: 'Quality Assurance (Hardware)',
    [roles.ENGINEERING_MAINTENANCE]: 'Engineering & Maintenance',
    [roles.EMBEDDED_HARDWARE_FIRMWARE]: 'Embedded Hardware and Firmware Department',
    [roles.REGULATORY_AFFAIRS]: 'Regulatory Affairs',
    [roles.STORE_INVENTORY]: 'Store & Inventory',
    [roles.SALES_MARKETING]: 'Sales & Marketing',
};

const MANAGE_USER_ROUTES = ['/admin/users', '/admin/users/edit-user/[id]'];
const SITE_CONFIGURATION_ROUTES = ['/admin/settings'];
const UNIVERSAL_ROUTES = [
    '/dashboard',
    '/profile',
    '/staff',
    '/admin/dashboard',
    '/dashboard/complaints',
    '/dashboard/complaints/new',
    '/dashboard/complaints/[id]',
    '/dashboard/device-lifecycle',
    '/dashboard/device-material-issues',
    '/dashboard/device-material-issues/new',
    '/dashboard/device-material-issues/[id]',
    '/dashboard/capa',
    '/dashboard/capa/[id]',
    '/dashboard/capa/new',
    '/dashboard/nc',
    '/dashboard/nc/new',
    '/dashboard/incoming-inspections',
    '/dashboard/incoming-inspections/new',
    '/dashboard/incoming-inspections/[id]',
];

export const ROLE_ACCESS = {
    [roles.SUPER_ADMIN]: {
        routes: [...UNIVERSAL_ROUTES, ...MANAGE_USER_ROUTES, ...SITE_CONFIGURATION_ROUTES],
        redirect: '/admin/dashboard',
    },
    [roles.SUPPORT]: {
        routes: UNIVERSAL_ROUTES,
        redirect: '/admin/dashboard',
    },
    [roles.QA]: {
        routes: UNIVERSAL_ROUTES,
        redirect: '/admin/dashboard',
    },
    [roles.PRODUCTION]: {
        routes: UNIVERSAL_ROUTES,
        redirect: '/admin/dashboard',
    },
    [roles.SOFTWARE]: {
        routes: UNIVERSAL_ROUTES,
        redirect: '/admin/dashboard',
    },
    [roles.DESIGN_DEVELOPMENT]: {
        routes: UNIVERSAL_ROUTES,
        redirect: '/admin/dashboard',
    },
    [roles.DEVOPS]: {
        routes: UNIVERSAL_ROUTES,
        redirect: '/admin/dashboard',
    },
    [roles.CLINICAL_RESEARCH]: {
        routes: UNIVERSAL_ROUTES,
        redirect: '/admin/dashboard',
    },
    [roles.AI_ML_TEAM]: {
        routes: UNIVERSAL_ROUTES,
        redirect: '/admin/dashboard',
    },
    [roles.QC_TEAM]: {
        routes: UNIVERSAL_ROUTES,
        redirect: '/admin/dashboard',
    },
    [roles.QUALITY_ANALYST_SOFTWARE]: {
        routes: UNIVERSAL_ROUTES,
        redirect: '/admin/dashboard',
    },
    [roles.QA_HARDWARE]: {
        routes: UNIVERSAL_ROUTES,
        redirect: '/admin/dashboard',
    },
    [roles.ENGINEERING_MAINTENANCE]: {
        routes: UNIVERSAL_ROUTES,
        redirect: '/admin/dashboard',
    },
    [roles.EMBEDDED_HARDWARE_FIRMWARE]: {
        routes: UNIVERSAL_ROUTES,
        redirect: '/admin/dashboard',
    },
    [roles.REGULATORY_AFFAIRS]: {
        routes: UNIVERSAL_ROUTES,
        redirect: '/admin/dashboard',
    },
    [roles.STORE_INVENTORY]: {
        routes: UNIVERSAL_ROUTES,
        redirect: '/admin/dashboard',
    },
    [roles.SALES_MARKETING]: {
        routes: UNIVERSAL_ROUTES,
        redirect: '/admin/dashboard',
    },
};

export const formatRoleLabel = (value?: string | null): string => {
    if (!value) return '';
    return (
        ROLE_LABELS[value as roles] ??
        value
            .replace(/[-_]/g, ' ')
            .replace(/\b\w/g, (char) => char.toUpperCase())
    );
};
