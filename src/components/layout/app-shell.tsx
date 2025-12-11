"use client";

import type { ReactNode } from "react";
import { useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { navSections } from "@/config/navigation";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Footer } from "@/components/layout/footer";
import { useLogout } from "@/hooks/api/useAuth";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Minimize2 } from "lucide-react";

type AppShellProps = {
  children: ReactNode;
};

const HIDDEN_PATH_PREFIXES = ["/auth", "/public"];

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const userRoles = user?.role ?? [];
  const userPermissions = user?.permissions ?? [];
  const isAuthenticated = !!user;
  const logoutMutation = useLogout();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const previousSidebarState = useRef(false);

  const confirmAndLogout = () => {
    if (logoutMutation.isPending) return;
    if (window.confirm("Are you sure you want to log out?")) {
      logoutMutation.mutate();
    }
  };

  const handleToggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      if (isFocusMode && prev) {
        setIsFocusMode(false);
      }
      return !prev;
    });
  };

  const handleToggleFocusMode = () => {
    setIsFocusMode((prev) => {
      const next = !prev;
      if (next) {
        previousSidebarState.current = sidebarCollapsed;
        setSidebarCollapsed(true);
      } else {
        setSidebarCollapsed(previousSidebarState.current);
      }
      return next;
    });
  };

  const isShellRoute = !HIDDEN_PATH_PREFIXES.some((prefix) => pathname?.startsWith(prefix));

  if (!isShellRoute) {
    return <>{children}</>;
  }

  const canView = (
    roles?: string[],
    requiresAuth?: boolean,
    hideWhenAuthenticated?: boolean,
  ) => {
    if (hideWhenAuthenticated && isAuthenticated) return false;
    if (requiresAuth && !isAuthenticated) return false;
    if (!roles || roles.length === 0) return true;
    return roles.some((role) => userRoles.includes(role));
  };

  const layoutClasses = cn(
    "relative flex w-full flex-1",
    isFocusMode ? "gap-0" : "gap-6"
  );

  const sidebarClasses = cn(
    "hidden h-full flex-shrink-0 flex-col overflow-hidden border border-border/30 bg-muted/30 shadow-sm transition-all duration-300",
    sidebarCollapsed ? "w-20 rounded-3xl" : "w-72 rounded-3xl",
    isFocusMode ? "lg:hidden" : "lg:flex lg:sticky lg:top-4"
  );

  return (
    <div className={layoutClasses}>
      <aside className={sidebarClasses}>
        <div
          className={cn(
            "flex h-20 items-center gap-3 px-6 transition-all duration-300",
            sidebarCollapsed && "justify-center px-4"
          )}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary font-semibold">
            Q
          </div>
          {!sidebarCollapsed && (
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                QMS Console
              </p>
              <p className="text-xs text-muted-foreground/80">Operations hub</p>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-8">
          <TooltipProvider delayDuration={0}>
            <nav className="space-y-6">
              {navSections.map((section) => {
                const links = section.items.filter((item) =>
                  canView(item.roles, item.requiresAuth, item.hideWhenAuthenticated),
                );
                if (links.length === 0) return null;

                return (
                  <div key={section.title} className="space-y-3">
                    {!sidebarCollapsed && (
                      <p className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {section.title}
                      </p>
                    )}
                    <div className="space-y-1">
                      {links.map((link) => {
                        const Icon = link.icon;
                        const isActive = pathname === link.href;

                        const content = link.action === "logout" ? (
                          <button
                            key={link.title}
                            type="button"
                            onClick={confirmAndLogout}
                            disabled={logoutMutation.isPending}
                            className={cn(
                              "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
                              "text-destructive hover:bg-destructive/10 hover:text-destructive",
                              logoutMutation.isPending && "opacity-60",
                              sidebarCollapsed && "justify-center px-2"
                            )}
                          >
                            {Icon && (
                              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-destructive/10">
                                <Icon className="h-4 w-4" />
                              </span>
                            )}
                            {!sidebarCollapsed && (
                              <span>{logoutMutation.isPending ? "Logging out…" : link.title}</span>
                            )}
                          </button>
                        ) : (
                          <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
                              isActive
                                ? "bg-primary/10 text-primary shadow-sm"
                                : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                              sidebarCollapsed && "justify-center px-2"
                            )}
                          >
                            {Icon && (
                              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-muted/50">
                                <Icon className="h-4 w-4" />
                              </span>
                            )}
                            {!sidebarCollapsed && <span>{link.title}</span>}
                          </Link>
                        );

                        if (!sidebarCollapsed) {
                          return content;
                        }

                        return (
                          <Tooltip key={link.title}>
                            <TooltipTrigger asChild>{content}</TooltipTrigger>
                            <TooltipContent side="right">
                              <span>{link.title}</span>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </nav>
          </TooltipProvider>
        </div>
      </aside>

      <div
        className={cn(
          "flex h-full w-full flex-1 flex-col rounded-3xl border border-border/30 bg-background shadow-sm transition-all duration-300 overflow-hidden",
          isFocusMode && "shadow-none"
        )}
      >
        <Header
          onToggleSidebar={handleToggleSidebar}
          isSidebarCollapsed={sidebarCollapsed}
          onToggleFocusMode={handleToggleFocusMode}
          isFocusMode={isFocusMode}
        />
        <div className="flex-1 overflow-hidden">
          <div
            className={cn(
              "relative h-full overflow-y-auto overflow-x-hidden px-4 py-6 pb-24 sm:px-8 lg:pb-10",
              isFocusMode && "px-4 py-4 pb-16 sm:px-6"
            )}
          >
            {isFocusMode && (
              <div className="sticky top-4 z-20 flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={handleToggleFocusMode}
                  className="backdrop-blur supports-[backdrop-filter]:bg-background/70"
                >
                  <Minimize2 className="mr-2 h-4 w-4" />
                  Exit Focus View
                </Button>
              </div>
            )}
            {children}
            <div className="mt-12">
              <Footer />
            </div>
          </div>
        </div>
        <MobileNav />
      </div>
    </div>
  );
}
