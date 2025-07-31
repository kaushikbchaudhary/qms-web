import {ROLE_ACCESS, UserRole} from "@/config/roles";

// export function hasAccess(pathname: string, roles: UserRole[]): boolean {
//     return roles.some(role => {
//         const allowedRoutes = ROLE_ACCESS[role].routes;
//         return allowedRoutes.some(route =>  pathname === route);
//     });
// }
export function hasAccess(pathname: string, userRoles: string[]): boolean {
    return userRoles.some(role => {
        const allowedRoutes = ROLE_ACCESS[role as keyof typeof ROLE_ACCESS]?.routes || [];
        return allowedRoutes.some(route => {
            // Convert dynamic route pattern to regex
            const routePattern = route
                .replace(/\[([^\]]+)\]/g, '[^/]+') // Replace [param] with wildcard
                .replace(/\//g, '\\/'); // Escape slashes

            const regex = new RegExp(`^${routePattern}$`);
            return regex.test(pathname);
        });
    });
}

export function getRedirectPath(roles: UserRole[]): string {
    // Return first role's redirect path or home
    return roles.length > 0 ? ROLE_ACCESS[roles[0]].redirect : '/';
}