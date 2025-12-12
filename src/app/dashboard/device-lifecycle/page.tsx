'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { format } from 'date-fns';
import {
  Activity,
  ArrowRight,
  CalendarClock,
  Download,
  History,
  Loader2,
  ScanSearch,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { apiClient, apiFileClient } from '@/lib/api/client';

type LifecycleResponse = {
  device?: any;
  currentAssignment?: any;
  subscription?: any;
  historyWindow?: { from?: string | null; to?: string | null };
  history?: any[];
  historyPagination?: { total: number; page: number; limit: number; pages: number };
};

type FetchState = 'idle' | 'loading' | 'error' | 'success';

const formatDate = (value?: string | null) => {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '—' : format(d, 'dd/MM/yyyy HH:mm');
};

export default function Home() {
  const [serialNo, setSerialNo] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [state, setState] = useState<FetchState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LifecycleResponse | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [loadingPdf, setLoadingPdf] = useState(false);

  const hasData = useMemo(() => Boolean(result?.device), [result]);
  const isLoading = state === 'loading';

  const fetchLifecycle = useCallback(async (nextPage?: number) => {
    if (!serialNo.trim()) {
      setError('Serial number is required.');
      return;
    }
    setState('loading');
    setError(null);
    try {
      const { data } = await apiClient.post('api/v1/device-lifecycle/lookup', {
        serialNo: serialNo.trim(),
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        page: nextPage ?? page,
        limit,
      });
      setResult(data);
      if (typeof nextPage === 'number') {
        setPage(nextPage);
      }
      setState('success');
    } catch (err: any) {
      setState('error');
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Failed to fetch lifecycle.';
      setError(msg);
    }
  }, [serialNo, fromDate, toDate, page, limit]);

  const onFetch = useCallback(() => fetchLifecycle(1), [fetchLifecycle]);

  const onDownload = useCallback(async () => {
    if (!serialNo.trim()) {
      setError('Serial number is required for PDF.');
      return;
    }
    setLoadingPdf(true);
    setError(null);
    try {
      const response = await apiFileClient.post('api/v1/device-lifecycle/export/pdf', {
        serialNo: serialNo.trim(),
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        page,
        limit,
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `device-lifecycle-${serialNo.trim()}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Failed to download PDF.';
      setError(msg);
    } finally {
      setLoadingPdf(false);
    }
  }, [serialNo, fromDate, toDate, page, limit]);

  const device = result?.device ?? {};
  const current = result?.currentAssignment ?? {};
  const subscription = result?.subscription ?? {};
  const history = result?.history ?? [];
  const pagination = result?.historyPagination;

  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-slate-50">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-10 h-72 bg-[radial-gradient(800px_at_50%_-20%,rgba(99,102,241,0.18),transparent)] blur-2xl dark:bg-[radial-gradient(800px_at_50%_-20%,rgba(94,234,212,0.12),transparent)]" />
        <div className="absolute right-10 top-24 h-64 w-64 rounded-full bg-primary/5 blur-3xl dark:bg-primary/10" />
      </div>

      <div className="relative mx-auto max-w-6xl space-y-8 px-4 py-8 md:px-6 md:py-12">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="outline" className="border-primary/40 bg-primary/5 text-primary dark:border-primary/50 dark:bg-primary/10">
                Device intelligence
              </Badge>
              <span className="inline-flex items-center gap-1">
                <Sparkles className="h-4 w-4" />
                Trace lifecycle in seconds
              </span>
            </div>
            <div className="space-y-1">
              <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                Device Issuance, Assign and Return Acknowledgment Form
              </h1>
              <p className="text-base text-muted-foreground">
                Search by serial number, refine with dates, and export the full trail as a PDF.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/60 px-3 py-1 backdrop-blur">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                Secure audit ready
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/60 px-3 py-1 backdrop-blur">
                <History className="h-4 w-4 text-sky-500" />
                Historical pagination
              </div>
            </div>
          </div>
        </header>

        <Card className="border-border/70 bg-card/80 shadow-lg backdrop-blur">
          <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-xl">Find a device</CardTitle>
              <CardDescription>Enter a serial number to pull live assignment and history.</CardDescription>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CalendarClock className="h-4 w-4" />
              Optional date window refines the log.
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-5">
              <div className="space-y-2 md:col-span-2">
                <Label className="text-sm">Serial number</Label>
                <Input
                  value={serialNo}
                  onChange={(e) => setSerialNo(e.target.value)}
                  placeholder="e.g. KE1023934591"
                  autoComplete="off"
                  className="border-border/80 bg-background/70 backdrop-blur"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">From date</Label>
                <Input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="border-border/80 bg-background/70 backdrop-blur"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">To date</Label>
                <Input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="border-border/80 bg-background/70 backdrop-blur"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Page</Label>
                <Input
                  type="number"
                  min={1}
                  value={page}
                  onChange={(e) => setPage(Math.max(1, parseInt(e.target.value || '1', 10)))}
                  className="border-border/80 bg-background/70 backdrop-blur"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Limit</Label>
                <Input
                  type="number"
                  min={1}
                  max={500}
                  value={limit}
                  onChange={(e) => setLimit(Math.max(1, parseInt(e.target.value || '25', 10)))}
                  className="border-border/80 bg-background/70 backdrop-blur"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={onFetch}
                disabled={isLoading}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 via-sky-600 to-cyan-500 text-white shadow-md transition hover:shadow-lg dark:from-indigo-500 dark:via-blue-500 dark:to-cyan-400"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanSearch className="h-4 w-4" />}
                {isLoading ? 'Fetching...' : 'Fetch lifecycle'}
              </Button>
              <Button
                onClick={onDownload}
                variant="outline"
                disabled={loadingPdf}
                className="inline-flex items-center gap-2 border-border/80 bg-background/60 backdrop-blur"
              >
                {loadingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                {loadingPdf ? 'Preparing PDF...' : 'Download PDF'}
              </Button>
              {error && (
                <Badge variant="destructive" className="text-xs">
                  {error}
                </Badge>
              )}
              {!error && hasData && (
                <Badge variant="outline" className="text-xs border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
                  Live data loaded
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {state === 'success' && hasData && (
          <div className="space-y-5">
            <div className="grid gap-4 lg:grid-cols-3">
              <Card className="border-border/70 bg-card/80 shadow-md backdrop-blur">
                <CardHeader className="space-y-1">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Activity className="h-5 w-5 text-sky-500" />
                    Device
                  </CardTitle>
                  <CardDescription className="flex flex-wrap items-center gap-2 text-xs">
                    <Badge variant="outline" className="border-primary/40 bg-primary/5 text-primary dark:border-primary/50 dark:bg-primary/10 dark:text-primary-foreground/90">
                      {device.status || 'Unknown status'}
                    </Badge>
                    <span className="text-muted-foreground">Serial {device.serialNo || '—'}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background/40 px-3 py-2">
                    <span>Name</span>
                    <span className="text-foreground font-medium">{device.name || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background/40 px-3 py-2">
                    <span>Model</span>
                    <span className="text-foreground font-medium">{device.model_no || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background/40 px-3 py-2">
                    <span>Company</span>
                    <span className="text-foreground font-medium">{device.company || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background/40 px-3 py-2">
                    <span>Vital</span>
                    <span className="text-foreground font-medium">{device.vital || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background/40 px-3 py-2">
                    <span>Active</span>
                    <span className="text-foreground font-medium">{String(device.active)}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/70 bg-card/80 shadow-md backdrop-blur">
                <CardHeader className="space-y-1">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ArrowRight className="h-5 w-5 text-indigo-500" />
                    Current assignment
                  </CardTitle>
                  <CardDescription>Where the device is now.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background/40 px-3 py-2">
                    <span>Clinic</span>
                    <span className="text-foreground font-medium">{current?.clinic?.name || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background/40 px-3 py-2">
                    <span>Sub clinic</span>
                    <span className="text-foreground font-medium">{current?.subClinic?.name || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background/40 px-3 py-2">
                    <span>Distributor</span>
                    <span className="text-foreground font-medium">{current?.distributor?.name || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background/40 px-3 py-2">
                    <span>Patient</span>
                    <span className="text-foreground font-medium">{current?.patient?.name || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background/40 px-3 py-2">
                    <span>Kit</span>
                    <span className="text-foreground font-medium">{current?.kit?.id || '—'}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/70 bg-card/80 shadow-md backdrop-blur">
                <CardHeader className="space-y-1">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ShieldCheck className="h-5 w-5 text-emerald-500" />
                    Subscription
                  </CardTitle>
                  <CardDescription>Commercial context and plan.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background/40 px-3 py-2">
                    <span>Type</span>
                    <span className="text-foreground font-medium">{subscription?.subscriptionType || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background/40 px-3 py-2">
                    <span>Charge</span>
                    <span className="text-foreground font-medium">{subscription?.subscriptionCharge ?? '—'}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background/40 px-3 py-2">
                    <span>ECG type</span>
                    <span className="text-foreground font-medium">{subscription?.ecgType || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background/40 px-3 py-2">
                    <span>Plan</span>
                    <span className="text-foreground font-medium">{subscription?.durationWisePlan || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background/40 px-3 py-2">
                    <span>Clinic</span>
                    <span className="text-foreground font-medium">{subscription?.clinicName || '—'}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-border/70 bg-card/80 shadow-md backdrop-blur">
              <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <History className="h-5 w-5 text-amber-500" />
                    Lifecycle history
                  </CardTitle>
                  <CardDescription>Windowed by your filters with pagination.</CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className="border-border/70 bg-background/50">
                    From {result?.historyWindow?.from ? formatDate(result.historyWindow.from) : '—'}
                  </Badge>
                  <Badge variant="outline" className="border-border/70 bg-background/50">
                    To {result?.historyWindow?.to ? formatDate(result.historyWindow.to) : '—'}
                  </Badge>
                  <Badge variant="outline" className="border-border/70 bg-background/50">
                    Records {pagination?.total ?? history.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-xl border border-border/70 bg-background/60 shadow-inner">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Details</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Created by</TableHead>
                        <TableHead>Updated by</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {history.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground">
                            No history found for this window.
                          </TableCell>
                        </TableRow>
                      )}
                      {history.map((row: any, idx: number) => (
                        <TableRow key={`${row?.date}-${idx}`}>
                          <TableCell className="font-medium text-foreground">{formatDate(row?.date)}</TableCell>
                          <TableCell className="text-foreground">{row?.type || '—'}</TableCell>
                          <TableCell className="text-muted-foreground">{row?.details || '—'}</TableCell>
                          <TableCell className="text-muted-foreground">{row?.reason || '—'}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {row?.createdBy?.name || row?.createdBy?.email || row?.createdBy?.id || '—'}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {row?.updatedBy?.name || row?.updatedBy?.email || row?.updatedBy?.id || '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <Separator />

                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => fetchLifecycle(Math.max((pagination?.page ?? page) - 1, 1))}
                    disabled={(pagination?.page ?? page) <= 1 || isLoading}
                    className="border-border/80 bg-background/60 backdrop-blur"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const currentPage = pagination?.page ?? page;
                      const totalPages = pagination?.pages ?? 1;
                      const nextPage = Math.min(currentPage + 1, totalPages);
                      fetchLifecycle(nextPage);
                    }}
                    disabled={(pagination?.page ?? page) >= (pagination?.pages ?? 1) || isLoading}
                    className="border-border/80 bg-background/60 backdrop-blur"
                  >
                    Next
                  </Button>
                  <Badge variant="outline" className="border-border/70 bg-background/50 text-xs text-muted-foreground">
                    Page {(pagination?.page ?? page)} of {(pagination?.pages ?? 1)}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {state === 'error' && !hasData && (
          <Card className="border-red-200/70 bg-red-50/70 text-red-700 shadow-md dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-100">
            <CardHeader>
              <CardTitle className="text-lg">We couldn&apos;t fetch the lifecycle</CardTitle>
              <CardDescription className="text-red-700/80 dark:text-red-100/70">
                {error || 'Something went wrong.'}
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </div>
  );
}
