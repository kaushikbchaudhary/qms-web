'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
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
import { useLogout } from '@/hooks/api/useAuth';
import { useAuthStore } from '@/stores/authStore';
import {
  useNotifications,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
} from '@/hooks/api/useNotifications';
import { formatRoleLabel } from '@/config/roles';
import type { NotificationItem } from '@/lib/api/endpoints/notifications';
import {
  User,
  LogOut,
  Bell,
  PanelLeftClose,
  PanelLeftOpen,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { cn, formatDateTime } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { BackButton } from "@/components/navigation/BackButton";

type HeaderProps = {
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
  onToggleFocusMode?: () => void;
  isFocusMode?: boolean;
};

export function Header({
  onToggleSidebar,
  isSidebarCollapsed = false,
  onToggleFocusMode,
  isFocusMode = false,
}: HeaderProps) {
  const currentPath = usePathname();
  const logoutMutation = useLogout();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const user = useAuthStore((state) => state.user);
  const [notificationView, setNotificationView] = useState<'pending' | 'all'>('pending');

  const notificationFilters = notificationView === 'pending'
    ? { status: 'unread' as const, scope: 'active' as const }
    : { status: 'all' as const, scope: 'all' as const };

  const { data: notifications = [], isFetching: notificationsLoading } = useNotifications(notificationFilters, {
    enabled: !!user
  });
  const unreadCount = notifications?.filter((notification) => !notification.read_at).length ?? 0;
  const previousUnreadRef = useRef(unreadCount);
  const [isBadgeAnimating, setIsBadgeAnimating] = useState(false);
  const { mutateAsync: markNotificationRead } = useMarkNotificationRead();
  const { mutateAsync: markAllNotificationsRead } = useMarkAllNotificationsRead();

  useEffect(() => {
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (unreadCount > previousUnreadRef.current) {
      setIsBadgeAnimating(true);
      const timeout = setTimeout(() => setIsBadgeAnimating(false), 650);
      previousUnreadRef.current = unreadCount;
      return () => clearTimeout(timeout);
    }
    previousUnreadRef.current = unreadCount;
  }, [unreadCount]);

  const showAuthSection = isReady && !!user && currentPath !== '/auth/login';
  const confirmAndLogout = () => {
    if (logoutMutation.isPending) return;
    if (window.confirm('Are you sure you want to log out?')) {
      logoutMutation.mutate();
    }
  };

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

  const formatDeviceStatus = (status?: string | null) => {
    if (!status) return 'Status unknown';
    return status
      .toLowerCase()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const getDeviceRequestIdentifier = (notification: NotificationItem) => {
    const requestNumber = notification.payload?.request_number;
    if (typeof requestNumber === 'string' && requestNumber.trim().length > 0) {
      return requestNumber.trim();
    }
    return 'Device request';
  };

  const resolveNotificationTitle = (notification: NotificationItem) => {
    if (notification.type?.startsWith('DEVICE_REQUEST')) {
      return getDeviceRequestIdentifier(notification);
    }
    return (
      notification.complaintNumber ||
      notification.payload?.complaint_number ||
      'Complaint update'
    );
  };

  const getNotificationDestination = (notification: NotificationItem) => {
    if (notification.complaint) {
      return `/dashboard/complaints/${notification.complaint}`;
    }
    const requestId = notification.payload?.requestId;
    if (typeof requestId === 'string' && requestId.trim()) {
      return `/dashboard/device-material-issues/${requestId}`;
    }
    return null;
  };

  const formatNotificationSummary = (notification: NotificationItem) => {
    switch (notification.type) {
      case 'COMPLAINT_ASSIGNED':
        return 'Complaint assigned to you';
      case 'INVESTIGATION_ASSIGNED':
        return 'Investigation task assigned';
      case 'INVESTIGATION_UPDATED':
        return 'Investigation updated';
      case 'COMPLAINT_OVERDUE': {
        const stageLabel = notification.payload?.stage === 'closure' ? 'Closure' : 'Investigation';
        const overdueBy = notification.payload?.overdueBy;
        const suffix = overdueBy ? `by ${overdueBy} working day(s).` : 'and needs attention.';
        return `${stageLabel} timeline overdue ${suffix}`;
      }
      case 'INVESTIGATION_OVERDUE': {
        const overdueBy = notification.payload?.overdueBy;
        const suffix = overdueBy ? `by ${overdueBy} working day(s).` : 'and needs attention.';
        return `Investigation timeline overdue ${suffix}`;
      }
      case 'DEVICE_REQUEST_SUBMITTED': {
        const identifier = getDeviceRequestIdentifier(notification);
        return `${identifier} was submitted`;
      }
      case 'DEVICE_REQUEST_READY_FOR_PICKUP': {
        const identifier = getDeviceRequestIdentifier(notification);
        return `${identifier} is ready for pickup`;
      }
      case 'DEVICE_REQUEST_ISSUED': {
        const identifier = getDeviceRequestIdentifier(notification);
        return `${identifier} has been issued`;
      }
      case 'DEVICE_REQUEST_STATUS_CHANGED': {
        const identifier = getDeviceRequestIdentifier(notification);
        const statusLabel = formatDeviceStatus(notification.payload?.status);
        return `${identifier} status updated to ${statusLabel}`;
      }
      default:
        return 'Complaint update';
    }
  };

  const getOverdueBadgeLabel = (notification: NotificationItem) => {
    if (notification.type === 'INVESTIGATION_OVERDUE') {
      return 'Investigation Overdue';
    }
    if (notification.type === 'COMPLAINT_OVERDUE') {
      return notification.payload?.stage === 'closure'
        ? 'Closure Overdue'
        : 'Investigation Overdue';
    }
    return null;
  };

  const formatComplaintStatus = (status?: string | null) => {
    if (!status) return 'Status unknown';
    return status
      .toLowerCase()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const headerClassName = useMemo(
    () =>
      cn(
        'sticky top-0 z-40 border-b border-border/40 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75 transition-all duration-300',
        isFocusMode && 'border-border/20 bg-background/60'
      ),
    [isFocusMode]
  );

  if (!isReady) {
    // Render minimal static header during SSR and initial hydration
    return (
      <header className={headerClassName}>
        <div className="flex h-16 items-center justify-between px-6 sm:px-8">
          <div className="flex items-center gap-3">
            <BackButton fallbackHref="/dashboard/complaints" />
            {!!onToggleSidebar && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="hidden rounded-full lg:flex"
                aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                onClick={onToggleSidebar}
              >
                {isSidebarCollapsed ? (
                  <PanelLeftOpen className="h-5 w-5" />
                ) : (
                  <PanelLeftClose className="h-5 w-5" />
                )}
              </Button>
            )}
            <Link
              href="/"
              className="flex items-center gap-2 text-lg font-semibold transition-colors hover:text-primary"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <span className="text-primary-foreground font-bold text-sm">Q</span>
              </div>
              <span>QMS</span>
            </Link>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {!!onToggleFocusMode && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="hidden rounded-full sm:flex"
                onClick={onToggleFocusMode}
                aria-label={isFocusMode ? 'Exit focus view' : 'Enter focus view'}
              >
                {isFocusMode ? (
                  <Minimize2 className="h-5 w-5" />
                ) : (
                  <Maximize2 className="h-5 w-5" />
                )}
              </Button>
            )}
            <ModeToggle />
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className={headerClassName}>
        <div className="flex h-16 items-center justify-between px-6 sm:px-8">
        <div className="flex items-center gap-3 sm:gap-4">
          <BackButton fallbackHref="/dashboard/complaints" />
          {onToggleSidebar && (
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="hidden rounded-full lg:flex"
                    aria-label={isSidebarCollapsed ? 'Expand navigation' : 'Collapse navigation'}
                    onClick={onToggleSidebar}
                  >
                    {isSidebarCollapsed ? (
                      <PanelLeftOpen className="h-5 w-5" />
                    ) : (
                      <PanelLeftClose className="h-5 w-5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <span>{isSidebarCollapsed ? 'Expand navigation' : 'Collapse navigation'}</span>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-semibold transition-colors hover:text-primary"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
              Q
            </div>
            <span>QMS System</span>
          </Link>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {onToggleFocusMode && (
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="hidden rounded-full sm:flex"
                    onClick={onToggleFocusMode}
                    aria-label={isFocusMode ? 'Exit focus view' : 'Enter focus view'}
                  >
                    {isFocusMode ? (
                      <Minimize2 className="h-5 w-5" />
                    ) : (
                      <Maximize2 className="h-5 w-5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <span>{isFocusMode ? 'Exit focus view' : 'Enter focus view'}</span>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className={cn(
                      'absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center px-1 transition-transform',
                      isBadgeAnimating && 'notification-badge-pop'
                    )}
                  >
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
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
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">View</span>
                  <div className="flex gap-2">
                    <Button
                      variant={notificationView === 'pending' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={(event) => {
                        event.preventDefault();
                        setNotificationView('pending');
                      }}
                    >
                      Pending
                    </Button>
                    <Button
                      variant={notificationView === 'all' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={(event) => {
                        event.preventDefault();
                        setNotificationView('all');
                      }}
                    >
                      All
                    </Button>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notificationsLoading ? (
                <DropdownMenuItem disabled>Loading notifications…</DropdownMenuItem>
              ) : notifications.length ? (
                notifications.slice(0, 10).map((notification) => {
                  const summaryText = formatNotificationSummary(notification);
                  const overdueBadge = getOverdueBadgeLabel(notification);
                  const title = resolveNotificationTitle(notification);
                  const destination = getNotificationDestination(notification);

                  return (
                    <DropdownMenuItem
                      key={notification._id}
                      onSelect={async (event) => {
                        event.preventDefault();
                        await markNotificationRead(notification._id);
                        if (destination) {
                          router.push(destination);
                        }
                      }}
                      className="flex items-start gap-3"
                    >
                      <div className="flex-1">
                        <div className="text-sm font-medium">{title}</div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span>{summaryText}</span>
                          {overdueBadge && (
                            <Badge variant="destructive" className="capitalize tracking-tight">
                              {overdueBadge}
                            </Badge>
                          )}
                          {notification.complaintStatus && (
                            <Badge variant="outline" className="capitalize tracking-tight">
                              {formatComplaintStatus(notification.complaintStatus)}
                            </Badge>
                          )}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {formatDateTime(notification.created_at)}
                        </div>
                      </div>
                      {!notification.read_at && (
                        <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                      )}
                    </DropdownMenuItem>
                  );
                })
              ) : (
                <DropdownMenuItem disabled>
                  {notificationView === 'pending'
                    ? 'No pending notifications'
                    : 'No notifications available'}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <ModeToggle />

          {showAuthSection && user && (
            <div className="flex items-center space-x-3">
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
                      <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-background bg-yellow-500">
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
                          className={cn('text-xs', getRoleColor(user.role[0]))}
                        >
                          {formatRoleLabel(user.role[0])}
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
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer text-red-600 focus:text-red-600"
                    onClick={confirmAndLogout}
                    disabled={logoutMutation.isPending}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{logoutMutation.isPending ? 'Logging out…' : 'Logout'}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
