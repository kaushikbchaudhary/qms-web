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
    roles: [ roles.SUPPORT],
  },
  {
    title: "QA Dashboard",
    href: "/staff/patients",
    roles: [roles.QA],
  },
  {
    title: "Profile",
    href: "/profile",
    roles: [roles.PRODUCTION],
  },
  {
    title: "Login",
    href: "/auth/login",
  },
];