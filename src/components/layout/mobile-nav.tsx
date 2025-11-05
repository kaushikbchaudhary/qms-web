"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navSections } from "@/config/navigation";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";
import { useLogout } from "@/hooks/api/useAuth";

const MAX_LINKS = 5;

export function MobileNav() {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const userRoles = user?.role ?? [];
  const isAuthenticated = !!user;
  const logoutMutation = useLogout();

  const links = navSections
    .flatMap((section) => section.items)
    .filter((item) => {
      if (item.hideWhenAuthenticated && isAuthenticated) return false;
      if (item.requiresAuth && !isAuthenticated) return false;
      if (item.roles && item.roles.length > 0) {
        return item.roles.some((role) => userRoles.includes(role));
      }
      return true;
    })
    .filter((item) => !item.href.startsWith("/admin"));

  const visibleLinks = links.slice(0, MAX_LINKS);

  if (visibleLinks.length === 0) {
    return null;
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-border/40 bg-background/95 py-2 backdrop-blur lg:hidden">
      {visibleLinks.map((link) => {
        const Icon = link.icon;
        const active = pathname === link.href;

        if (link.action === "logout") {
          return (
            <button
              key={link.title}
              type="button"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              className="flex flex-1 flex-col items-center gap-1 text-xs text-muted-foreground"
            >
              {Icon && (
                <Icon
                  className={cn(
                    "h-5 w-5 transition",
                    logoutMutation.isPending ? "opacity-50" : "text-destructive",
                  )}
                />
              )}
              <span className="truncate text-destructive font-medium">
                {logoutMutation.isPending ? "Logging out…" : link.title}
              </span>
            </button>
          );
        }

        return (
          <Link
            key={link.href}
            href={link.href}
            className="flex flex-1 flex-col items-center gap-1 text-xs"
          >
            {Icon && (
              <Icon
                className={cn(
                  "h-5 w-5 transition",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              />
            )}
            <span
              className={cn(
                "truncate",
                active ? "text-primary font-medium" : "text-muted-foreground",
              )}
            >
              {link.title.replace(/^New\s+/i, "")}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
