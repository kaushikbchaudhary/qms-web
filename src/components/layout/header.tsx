'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ModeToggle from '@/components/ui/mode-toggle';
import { mainNav, NavItem } from "@/config/navigation";
import { useLogout } from "@/hooks/api/useAuth";
import { useAuthStore } from "@/stores/authStore";
import { useNotifications, useMarkAllNotificationsRead, useMarkNotificationRead } from '@/hooks/api/useNotifications';
import { User, LogOut, Settings, Shield, Bell } from 'lucide-react';
import { cn, formatDateTime } from '@/lib/utils';

export function Header() {
  const currentPath = usePathname();
  const logoutMutation = useLogout();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const user = useAuthStore((state) => state.user);
  const { data: notifications = [], isFetching: notificationsLoading } = useNotifications('all', {
    enabled: !!user
  });
  const unreadCount = notifications?.filter((notification) => !notification.read_at).length ?? 0;
  const { mutateAsync: markNotificationRead } = useMarkNotificationRead();
  const { mutateAsync: markAllNotificationsRead } = useMarkAllNotificationsRead();

  useEffect(() => {
    setIsReady(true);
  }, []);

  const filteredNavItems = useMemo<NavItem[]>(() => {
    return mainNav.filter((navItem) => {
      if (currentPath === '/auth/login') return navItem.href === '/auth/login';
      if (navItem.href === '/auth/login') return false;
      if (!navItem.roles) return true;
      if (!user?.role?.[0]) return false;
      return navItem.roles.includes(user.role[0]);
    });
  }, [currentPath, user]);

  const showAuthSection = isReady && !!user && currentPath !== '/auth/login';

  const isActive = (href: string) => currentPath === href;

  // Generate user initials for avatar
  const getUserInitials = (user: any) => {
    if (!user) return 'U';
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
  };

  // Get user display name
  const getUserDisplayName = (user: any) => {
    if (!user) return 'User';
    const parts = [user.firstName, user.middleName, user.lastName].filter(Boolean);
    return parts.join(' ') || user.emailId || 'User';
  };

  // Get role color
  const getRoleColor = (role: string) => {
    const roleColors: Record<string, string> = {
      admin: 'bg-red-100 text-red-800 hover:bg-red-100',
      support: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
      user: 'bg-green-100 text-green-800 hover:bg-green-100',
      manager: 'bg-purple-100 text-purple-800 hover:bg-purple-100',
    };
    return roleColors[role.toLowerCase()] || 'bg-gray-100 text-gray-800 hover:bg-gray-100';
  };

  if (!isReady) {
    // Render minimal static header during SSR and initial hydration
    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <Link
                href="/"
                className="flex items-center space-x-2 font-bold text-lg hover:text-primary transition-colors"
            >
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">Q</span>
              </div>
              <span>QMS System</span>
            </Link>
            <ModeToggle />
          </div>
        </header>
    );
  }

  return (
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          {/* Logo Section */}
          <div className="flex items-center space-x-8">
            <Link
                href="/"
                className="flex items-center space-x-2 font-bold text-lg hover:text-primary transition-colors"
            >
              {/*<div className="h-8 w-9 rounded-lg bg-primary flex items-center justify-center">*/}
              {/*  <span className="text-primary-foreground font-bold text-sm">Q</span>*/}
              {/*  <span className="text-primary-foreground font-bold text-sm">M</span>*/}
              {/*  <span className="text-primary-foreground font-bold text-sm">S</span>*/}
              {/*</div>*/}
              <span>QMS System</span>
            </Link>


          </div>


          {/* Right Section */}
          <div className="flex items-center space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 flex items-center justify-center">
                      {unreadCount}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex items-center justify-between">
                  <span>Notifications</span>
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async (event) => {
                        event.preventDefault();
                        await markAllNotificationsRead();
                      }}
                    >
                      Mark all as read
                    </Button>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notificationsLoading ? (
                  <DropdownMenuItem disabled>Loading notifications…</DropdownMenuItem>
                ) : notifications.length ? (
                  notifications.slice(0, 10).map((notification) => (
                    <DropdownMenuItem
                      key={notification._id}
                      onSelect={async (event) => {
                        event.preventDefault();
                        await markNotificationRead(notification._id);
                        if (notification.complaint) {
                          router.push(`/dashboard/complaints/${notification.complaint}`);
                        }
                      }}
                      className="flex items-start gap-3"
                    >
                      <div className="flex-1">
                        <div className="text-sm font-medium">
                          {notification.payload?.complaint_number || 'Complaint update'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {notification.type === 'COMPLAINT_ASSIGNED'
                            ? 'Complaint assigned to you'
                            : notification.type === 'INVESTIGATION_ASSIGNED'
                              ? 'Investigation task assigned'
                              : 'Investigation updated'}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {formatDateTime(notification.created_at)}
                        </div>
                      </div>
                      {!notification.read_at && <span className="mt-1 h-2 w-2 rounded-full bg-primary" />}
                    </DropdownMenuItem>
                  ))
                ) : (
                  <DropdownMenuItem disabled>No notifications</DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            {/* Navigation Links */}
            <nav className="hidden md:flex items-center space-x-1">
              {filteredNavItems.map((navItem) => (
                  <Link
                      key={navItem.href}
                      href={navItem.href}
                      className={cn(
                          "px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 relative",
                          isActive(navItem.href)
                              ? "bg-primary text-primary-foreground shadow-sm"
                              :
                              "text-muted-foreground hover:text-foreground hover:bg-accent"
                      )}
                  >
                    {navItem.title}
                    {/*{isActive(navItem.href) && (*/}
                    {/*    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />*/}
                    {/*)}*/}
                  </Link>
              ))}
            </nav>
            <ModeToggle />
            {/* Mobile Navigation */}
            <div className="md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    Menu
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {filteredNavItems.map((navItem) => (
                      <DropdownMenuItem key={navItem.href} asChild>
                        <Link href={navItem.href} className="w-full">
                          {navItem.title}
                        </Link>
                      </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Profile Section */}
            {showAuthSection && user && (
                <div className="flex items-center space-x-3">
                  {/* User Role Badge */}
                  {/*<Badge*/}
                  {/*    variant="secondary"*/}
                  {/*    className={cn("hidden sm:inline-flex", getRoleColor(user.role[0]))}*/}
                  {/*>*/}
                  {/*  <Shield className="w-3 h-3 mr-1" />*/}
                  {/*  {user.role[0]}*/}
                  {/*</Badge>*/}

                  {/* Profile Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                        <Avatar className="h-10 w-10 border-2 border-border">
                          <AvatarImage src="" alt={getUserDisplayName(user)} />
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {getUserInitials(user)}
                          </AvatarFallback>
                        </Avatar>
                        {!user.isVerified && (
                            <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-yellow-500 border-2 border-background flex items-center justify-center">
                              <span className="text-xs text-white">!</span>
                            </div>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64">
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-2">
                          <p className="text-sm font-medium leading-none">
                            {getUserDisplayName(user)}
                          </p>
                          <p className="text-xs leading-none text-muted-foreground">
                            {user.emailId}
                          </p>
                          {user.organization && (
                              <p className="text-xs leading-none text-muted-foreground">
                                {user.organization}
                              </p>
                          )}
                          <div className="flex items-center space-x-2">
                            <Badge
                                variant="secondary"
                                className={cn("text-xs", getRoleColor(user.role[0]))}
                            >
                              {user.role[0]}
                            </Badge>
                            {!user.isVerified && (
                                <Badge variant="destructive" className="text-xs">
                                  Unverified
                                </Badge>
                            )}
                          </div>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {/*<DropdownMenuItem asChild>*/}
                      {/*  <Link href="/profile" className="cursor-pointer">*/}
                      {/*    <User className="mr-2 h-4 w-4" />*/}
                      {/*    <span>Profile</span>*/}
                      {/*  </Link>*/}
                      {/*</DropdownMenuItem>*/}
                      {/*<DropdownMenuItem asChild>*/}
                      {/*  <Link href="/settings" className="cursor-pointer">*/}
                      {/*    <Settings className="mr-2 h-4 w-4" />*/}
                      {/*    <span>Settings</span>*/}
                      {/*  </Link>*/}
                      {/*</DropdownMenuItem>*/}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                          className="cursor-pointer text-red-600 focus:text-red-600"
                          onClick={() => logoutMutation.mutate()}
                          disabled={logoutMutation.isPending}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>{logoutMutation.isPending ? 'Logging out...' : 'Logout'}</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
            )}

            {/* Mode Toggle */}
            {/*<ModeToggle />*/}
          </div>
        </div>
      </header>
  );
}
