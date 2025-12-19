import { allRoles, roles } from "@/config/roles";
import type { LucideIcon } from "lucide-react";
import {
  ClipboardList,
  ClipboardPlus,
  FileWarning,
  LayoutDashboard,
  LogIn,
  LogOut as LogOutIcon,
  ScanSearch,
  PackagePlus,
  PackageSearch,
  Settings,
  Users,
} from "lucide-react";

export type NavLink = {
  title: string;
  href: string;
  icon?: LucideIcon;
  roles?: string[];
  hotkey?: string;
  requiresAuth?: boolean;
  hideWhenAuthenticated?: boolean;
  action?: "logout";
};

export type NavSection = {
  title: string;
  items: NavLink[];
};

export const navSections: NavSection[] = [
  {
    title: "Workspace",
    items: [
      {
        title: "Complaints",
        href: "/dashboard/complaints",
        icon: ClipboardList,
        roles: allRoles,
      },
      {
        title: "Device/Material Requests",
        href: "/dashboard/device-material-issues",
        icon: PackageSearch,
        roles: allRoles,
      },
      {
        title: "Incoming Inspections",
        href: "/dashboard/incoming-inspections",
        icon: ScanSearch,
        roles: allRoles,
      },
      // {
      //   title: "Device Lifecycle",
      //   href: "/dashboard/device-lifecycle",
      //   icon: ScanSearch,
      //   roles: allRoles,
      // },
      {
        title: "CAPA Records",
        href: "/dashboard/capa",
        icon: ClipboardList,
        roles: allRoles,
      },
      {
        title: "NC Reports",
        href: "/dashboard/nc",
        icon: FileWarning,
        roles: allRoles,
      },
    ],
  },
  {
    title: "Quick Actions",
    items: [
      {
        title: "New Complaint",
        href: "/dashboard/complaints/new",
        icon: ClipboardPlus,
        roles: allRoles,
        hotkey: "N",
      },
      {
        title: "New CAPA",
        href: "/dashboard/capa/new",
        icon: ClipboardPlus,
        roles: allRoles,
        hotkey: "C",
      },
      {
        title: "New NC Report",
        href: "/dashboard/nc/new",
        icon: ClipboardPlus,
        roles: allRoles,
        hotkey: "R",
      },
      {
        title: "New Device Request",
        href: "/dashboard/device-material-issues/new",
        icon: PackagePlus,
        roles: allRoles,
        hotkey: "D",
      },
      {
        title: "New Incoming Inspection",
        href: "/dashboard/incoming-inspections/new",
        icon: ClipboardPlus,
        roles: allRoles,
      },
      {
        title: "Device Lifecycle Lookup",
        href: "/dashboard/device-lifecycle",
        icon: ScanSearch,
        roles: allRoles,
      },
    ],
  },
  {
    title: "Administration",
    items: [
      {
        title: "Dashboard",
        href: "/admin/dashboard",
        icon: LayoutDashboard,
        roles: allRoles,
      },
      {
        title: "Site Settings",
        href: "/admin/settings",
        icon: Settings,
        roles: [roles.SUPER_ADMIN],
      },
      {
        title: "Manage Users",
        href: "/admin/users",
        icon: Users,
        roles: [roles.SUPER_ADMIN],
      },
    ],
  },
  {
    title: "Access",
    items: [
      {
        title: "Login",
        href: "/auth/login",
        icon: LogIn,
        hideWhenAuthenticated: true,
      },
      {
        title: "Logout",
        href: "#logout",
        icon: LogOutIcon,
        requiresAuth: true,
        action: "logout",
      },
    ],
  },
];

export const flatNavLinks: NavLink[] = navSections.flatMap((section) => section.items);
