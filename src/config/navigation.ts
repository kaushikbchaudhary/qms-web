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
    roles: [roles.SUPPORT, roles.SALES_MARKETING],
  },
  {
    title: "My Complaints",
    href: "/dashboard/complaints",
    roles: [
      roles.SUPPORT,
      roles.SUPER_ADMIN,
      roles.QA,
      roles.QUALITY_ANALYST_SOFTWARE,
      roles.QA_HARDWARE,
      roles.PRODUCTION,
      roles.ENGINEERING_MAINTENANCE,
      roles.HARDWARE_FIRMWARE_ENGINEER,
      roles.REGULATORY_AFFAIRS,
    ],
  },
  {
    title: "Device Requests",
    href: "/dashboard/device-material-issues",
    roles: [
      roles.SUPPORT,
      roles.SALES_MARKETING,
      roles.SUPER_ADMIN,
      roles.QA,
      roles.QUALITY_ANALYST_SOFTWARE,
      roles.QA_HARDWARE,
      roles.PRODUCTION,
      roles.ENGINEERING_MAINTENANCE,
      roles.HARDWARE_FIRMWARE_ENGINEER,
      roles.STORE_INVENTORY,
      roles.REGULATORY_AFFAIRS,
    ],
  },
  {
    title: "New Device Request",
    href: "/dashboard/device-material-issues/new",
    roles: [roles.HARDWARE_FIRMWARE_ENGINEER,roles.AI_ML_TEAM,roles.ENGINEERING_MAINTENANCE,roles.ENGINEERING_MAINTENANCE,roles.STORE_INVENTORY,roles.REGULATORY_AFFAIRS,roles.HARDWARE_FIRMWARE_ENGINEER,roles.HARDWARE,roles.SUPPORT, roles.SALES_MARKETING, roles.SUPER_ADMIN, roles.QA, roles.QUALITY_ANALYST_SOFTWARE, roles.QA_HARDWARE, roles.PRODUCTION,roles.ENGINEERING_MAINTENANCE],
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
