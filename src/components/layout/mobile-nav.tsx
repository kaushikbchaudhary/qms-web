"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { navSections } from "@/config/navigation";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";
import { useLogout } from "@/hooks/api/useAuth";
import { ChevronUp, ChevronDown, LogOut } from "lucide-react";

const MAX_LINKS = 6;

export function MobileNav() {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const userRoles = useMemo(() => user?.role ?? [], [user]);
  const isAuthenticated = !!user;
  const logoutMutation = useLogout();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const confirmAndLogout = () => {
    if (logoutMutation.isPending) return;
    if (window.confirm("Are you sure you want to log out?")) {
      logoutMutation.mutate();
    }
  };

  const links = useMemo(
    () =>
      navSections
        .flatMap((section) => section.items)
        .filter((item) => {
          if (item.hideWhenAuthenticated && isAuthenticated) return false;
          if (item.requiresAuth && !isAuthenticated) return false;
          if (item.roles && item.roles.length > 0) {
            return item.roles.some((role) => userRoles.includes(role));
          }
          return true;
        })
        .filter((item) => !item.href.startsWith("/admin")),
    [isAuthenticated, userRoles]
  );

  const visibleLinks = links.slice(0, MAX_LINKS);

  if (visibleLinks.length === 0) {
    return null;
  }

  return (
    <>
      {isOpen ? (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-30 bg-background/40 backdrop-blur-sm transition lg:hidden"
        />
      ) : null}

      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center lg:hidden">
        <div className="flex w-full max-w-md flex-col items-center gap-3 px-4">
          <button
            type="button"
            aria-expanded={isOpen}
            aria-controls="mobile-nav-tray"
            onClick={() => setIsOpen((prev) => !prev)}
            className="pointer-events-auto flex items-center justify-center rounded-full border border-border/60 bg-background/95 p-3 shadow-lg backdrop-blur transition hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {isOpen ? (
              <ChevronDown className="h-5 w-5 text-foreground" />
            ) : (
              <ChevronUp className="h-5 w-5 text-foreground" />
            )}
          </button>

          <div
            id="mobile-nav-tray"
            className={cn(
              "pointer-events-auto w-full overflow-hidden rounded-3xl border border-border/40 bg-background/95 shadow-xl backdrop-blur transition-all duration-300",
              isOpen
                ? "opacity-100 translate-y-0"
                : "pointer-events-none -translate-y-2 opacity-0"
            )}
          >
            <nav className="flex items-end justify-center gap-4 px-4 py-3">
            {visibleLinks.map((link) => {
              const Icon = link.icon;
              const active = pathname === link.href;
              const isLogout = link.action === "logout";

              if (isLogout) {
                return (
                  <button
                    key={link.title}
                    type="button"
                    onClick={confirmAndLogout}
                    disabled={logoutMutation.isPending}
                    className={cn(
                      "flex flex-col items-center gap-1 text-xs",
                      logoutMutation.isPending
                        ? "text-muted-foreground opacity-50"
                        : "text-destructive"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-full border border-destructive/40 bg-destructive/10 transition",
                        logoutMutation.isPending ? "border-opacity-20" : ""
                      )}
                    >
                      <LogOut className="h-5 w-5" />
                    </span>
                    <span className="text-[0.7rem] font-medium">
                      {logoutMutation.isPending ? "Logging out…" : link.title}
                    </span>
                  </button>
                );
              }

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex flex-col items-center gap-1 text-xs transition duration-300 ease-out",
                    active
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-full border border-border/50 bg-muted/30 transition-transform duration-300",
                      active
                        ? "scale-110 border-primary/60 bg-primary/10 shadow-md shadow-primary/30"
                        : "scale-100"
                    )}
                  >
                    {Icon && <Icon className={cn("h-5 w-5", active ? "text-primary" : "")} />}
                  </span>
                  <span
                    className={cn(
                      "text-[0.7rem] font-medium tracking-tight transition",
                      active ? "translate-y-0 text-primary" : "translate-y-1"
                    )}
                  >
                    {link.title.replace(/^New\s+/i, "")}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
    </>
  );
}
