"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ComplaintStatusBadge } from "@/components/complaient/ComplaintStatusBadge";
import { useComplaintSerialStats } from "@/hooks/api/useComplaints";
import { Separator } from "@/components/ui/separator";

const formatDate = (value?: string) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

export default function ComplaintSerialLookupPage() {
  const [serialInput, setSerialInput] = useState("");
  const [querySerial, setQuerySerial] = useState("");
  const { data: stats, isFetching } = useComplaintSerialStats(querySerial);

  const statusEntries = useMemo(() => {
    if (!stats?.statusCounts) return [];
    return Object.entries(stats.statusCounts).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0));
  }, [stats?.statusCounts]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setQuerySerial(serialInput.trim());
  };

  const handleQuickFill = (value: string) => {
    setSerialInput(value);
    setQuerySerial(value);
  };

  const hasResults = Boolean(stats && stats.total > 0);

  return (
    <div className="space-y-8 py-8">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Serial number insights</h1>
          <p className="text-sm text-muted-foreground">
            Search a device serial number to see how many complaints reference it and spot repeat issues.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => handleQuickFill(serialInput.trim())} disabled={!serialInput.trim()}>
            Refresh lookup
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Find complaints by serial number</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 md:flex-row">
            <Input
              value={serialInput}
              onChange={(event) => setSerialInput(event.target.value)}
              placeholder="Enter device serial number"
              className="md:w-96"
            />
            <div className="flex gap-2">
              <Button type="submit" disabled={!serialInput.trim() || isFetching}>
                {isFetching ? "Searching..." : "Search"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setSerialInput("")}>
                Clear
              </Button>
            </div>
          </form>

          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span>Quick fill:</span>
            {["KE1", "KE3", "KE"].map((sample) => (
              <Badge
                key={sample}
                variant="secondary"
                className="cursor-pointer"
                onClick={() => handleQuickFill(sample)}
              >
                {sample}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {querySerial && !isFetching && !hasResults && (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center space-y-2">
            <p className="text-lg font-medium">No complaints found for “{querySerial}”.</p>
            <p className="text-sm text-muted-foreground">
              Try a different serial number or confirm the product details.
            </p>
          </CardContent>
        </Card>
      )}

      {hasResults && stats && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <Card className="xl:col-span-1">
            <CardHeader>
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Serial number</p>
                <p className="text-lg font-semibold">{stats.serial_number}</p>
              </div>
              <div className="rounded-lg border bg-muted/30 px-3 py-3">
                <p className="text-sm text-muted-foreground">Total complaints</p>
                <p className="text-3xl font-semibold">{stats.total}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Statuses</p>
                <div className="flex flex-wrap gap-2">
                  {statusEntries.map(([status, count]) => (
                    <Badge key={status} variant="outline" className="flex items-center gap-2">
                      <span className="font-semibold">{count}</span>
                      <span className="text-xs uppercase tracking-wide text-muted-foreground">{status}</span>
                    </Badge>
                  ))}
                  {statusEntries.length === 0 && (
                    <p className="text-sm text-muted-foreground">No status breakdown available.</p>
                  )}
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <p className="text-sm font-medium">Repeat issues by type</p>
                <div className="space-y-2">
                  {stats.issues.length === 0 && (
                    <p className="text-sm text-muted-foreground">No linked issues recorded.</p>
                  )}
                  {stats.issues.slice(0, 5).map((issue) => (
                    <div key={issue.label} className="flex items-center justify-between rounded-md border px-3 py-2">
                      <span className="text-sm font-medium">{issue.label}</span>
                      <Badge variant="secondary">{issue.count}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle>Recent complaints</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <div className="min-w-[680px]">
                <div className="grid grid-cols-7 border-b pb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <span>#</span>
                  <span>Status</span>
                  <span>Type</span>
                  <span>Model</span>
                  <span>Serial</span>
                  <span>Issue</span>
                  <span>Created</span>
                </div>
                <div className="divide-y">
                  {stats.recent.map((item) => (
                    <Link
                      key={item._id}
                      href={`/dashboard/complaints/${item._id}`}
                      className="grid grid-cols-7 items-center py-3 text-sm transition hover:bg-muted/50"
                    >
                      <span className="font-semibold">{item.complaint_number ?? "—"}</span>
                      <div className="flex items-center">
                        {item.status ? (
                          <ComplaintStatusBadge status={item.status} />
                        ) : (
                          <Badge variant="outline">N/A</Badge>
                        )}
                      </div>
                      <span className="text-muted-foreground">{item.complaint_type || "—"}</span>
                      <span className="text-muted-foreground">{item.product_model || "—"}</span>
                      <span className="text-muted-foreground">
                        {item.product_serial || item.replacement_serial || "—"}
                      </span>
                      <span className="line-clamp-2 text-muted-foreground">{item.issue || "—"}</span>
                      <span className="text-muted-foreground">{formatDate(item.submission_date ?? item.created_on)}</span>
                    </Link>
                  ))}
                  {stats.recent.length === 0 && (
                    <div className="py-6 text-sm text-muted-foreground">No recent complaints for this serial number.</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
