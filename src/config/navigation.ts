// config/navigation.ts

import {roles} from "@/config/roles";

export type NavItem = {
  title: string;
  href: string;
  roles?: string[]; // Optional - if not specified, item will be visible to all roles
};

export const mainNav: NavItem[] = [
  {
    title: "Home",
    href: "/",
    roles:[],
  },
  {
    title: "Admin Dashboard",
    href: "/admin/dashboard",
    roles: [roles.SUPER_ADMIN],
  },
  {
    title: "Site Settings",
    href: "/admin/settings",
    roles: [roles.SUPER_ADMIN],
  },
  {
    title: "Manage Users",
    href: "/admin/users",
    roles: [roles.SUPER_ADMIN],
  },
  {
    title: "Submit Complaint",
    href: "/dashboard/complaints/new",
    roles: [roles.SUPPORT],
  },
  {
    title: "My Complaints",
    href: "/dashboard/complaints",
    roles: [ roles.SUPPORT, roles.SUPER_ADMIN,roles.QA,roles.PRODUCTION ],
  },
  {
    title: "Device Requests",
    href: "/dashboard/device-material-issues",
    roles: [roles.SUPPORT, roles.SUPER_ADMIN, roles.QA, roles.PRODUCTION],
  },
  {
    title: "New Device Request",
    href: "/dashboard/device-material-issues/new",
    roles: [roles.SUPPORT, roles.SUPER_ADMIN],
  },
  {
    title: "QA Dashboard",
    href: "/staff/patients",
    roles: [roles.QA],
  },
  // {
  //   title: "Profile",
  //   href: "/profile",
  //   roles: [roles.SUPER_ADMIN, roles.SUPPORT, roles.QA, roles.PRODUCTION],
  // },
  {
    title: "Login",
    href: "/auth/login",
  },
];
