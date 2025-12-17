"use client";

import Link from "next/link";
import { ClipboardPlus, PackagePlus, ScanSearch, ClipboardList } from "lucide-react";

const quickActions = [
  { title: "Create Complaint", href: "/dashboard/complaints/new", icon: ClipboardPlus },
  { title: "Complaint List", href: "/dashboard/complaints", icon: ClipboardList },
  { title: "Device Request", href: "/dashboard/device-material-issues/new", icon: PackagePlus },
  { title: "Device Lifecycle", href: "/dashboard/device-lifecycle", icon: ScanSearch },
];

export default function Home() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-10">
      <section className="space-y-3">
        <p className="text-sm text-muted-foreground">QMS workspace</p>
        <h1 className="text-3xl font-semibold tracking-tight">What do you want to do?</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Jump straight into creating complaints, raising device/material requests, or checking device lifecycles.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className="group rounded-2xl border border-border/60 bg-card p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <Icon className="h-5 w-5 text-primary" />
                <span className="text-xs text-muted-foreground group-hover:text-foreground">Open</span>
              </div>
              <p className="mt-3 text-lg font-medium">{action.title}</p>
            </Link>
          );
        })}
      </section>
    </main>
  );
}
