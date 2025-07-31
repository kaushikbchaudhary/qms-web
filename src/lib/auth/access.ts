import {ROLE_ACCESS, UserRole} from "@/config/roles";

export function hasAccess(pathname: string, roles: UserRole[]): boolean {
    return roles.some(role => {
        const allowedRoutes = ROLE_ACCESS[role].routes;
        return allowedRoutes.some(route =>  pathname === route);
    });
}

export function getRedirectPath(roles: UserRole[]): string {
    // Return first role's redirect path or home
    return roles.length > 0 ? ROLE_ACCESS[roles[0]].redirect : '/';
}