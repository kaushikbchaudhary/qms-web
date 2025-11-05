"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { navSections } from "@/config/navigation";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Footer } from "@/components/layout/footer";
import { useLogout } from "@/hooks/api/useAuth";

type AppShellProps = {
  children: ReactNode;
};

const HIDDEN_PATH_PREFIXES = ["/auth", "/public"];

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const userRoles = user?.role ?? [];
  const isAuthenticated = !!user;
  const logoutMutation = useLogout();

  const isShellRoute = !HIDDEN_PATH_PREFIXES.some((prefix) => pathname?.startsWith(prefix));

  if (!isShellRoute) {
    return <>{children}</>;
  }

  const canView = (roles?: string[], requiresAuth?: boolean, hideWhenAuthenticated?: boolean) => {
    if (hideWhenAuthenticated && isAuthenticated) return false;
    if (requiresAuth && !isAuthenticated) return false;
    if (!roles || roles.length === 0) return true;
    return roles.some((role) => userRoles.includes(role));
  };

  return (
    <div className="relative flex flex-1 gap-6">
      <aside className="hidden h-full w-72 flex-shrink-0 flex-col overflow-hidden rounded-3xl border border-border/30 bg-muted/30 shadow-sm lg:flex">
        <div className="flex h-20 items-center gap-3 px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary font-semibold">
            Q
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              QMS Console
            </p>
            <p className="text-xs text-muted-foreground/80">Operations hub</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-8">
          <nav className="space-y-6">
            {navSections.map((section) => {
              const links = section.items.filter((item) =>
                canView(item.roles, item.requiresAuth, item.hideWhenAuthenticated),
              );
              if (links.length === 0) return null;

              return (
                <div key={section.title} className="space-y-3">
                  <p className="px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {section.title}
                  </p>
                  <div className="space-y-1">
                    {links.map((link) => {
                      const Icon = link.icon;
                      const isActive = pathname === link.href;

                      if (link.action === "logout") {
                        return (
                          <button
                            key={link.title}
                            type="button"
                            onClick={() => logoutMutation.mutate()}
                            disabled={logoutMutation.isPending}
                            className={cn(
                              "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
                              "text-destructive hover:bg-destructive/10 hover:text-destructive",
                              logoutMutation.isPending && "opacity-60",
                            )}
                          >
                            {Icon && (
                              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-destructive/10">
                                <Icon className="h-4 w-4" />
                              </span>
                            )}
                            <span>{logoutMutation.isPending ? "Logging out…" : link.title}</span>
                          </button>
                        );
                      }

                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
                            isActive
                              ? "bg-primary/10 text-primary shadow-sm"
                              : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                          )}
                        >
                          {Icon && (
                            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-muted/50">
                              <Icon className="h-4 w-4" />
                            </span>
                          )}
                          <div className="flex flex-col">
                            <span>{link.title}</span>
                            {link.hotkey && (
                              <span className="text-xs text-muted-foreground/70">
                                Shortcut: {link.hotkey}
                              </span>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>
        </div>
      </aside>

      <div className="flex h-full flex-1 flex-col overflow-hidden rounded-3xl border border-border/30 bg-background shadow-sm">
        <Header />
        <div className="flex-1 overflow-y-auto px-4 py-6 pb-24 sm:px-8 lg:pb-10">
          {children}
          <div className="mt-12">
            <Footer />
          </div>
        </div>
        <MobileNav />
      </div>
    </div>
  );
}
