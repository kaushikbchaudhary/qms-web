'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { apiClient, apiFileClient } from '@/lib/api/client';
import { format } from 'date-fns';

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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">QMS</p>
            <h1 className="text-2xl font-semibold text-slate-900">Device Lifecycle Lookup</h1>
          </div>
          <div className="text-sm text-slate-500">
            Enter serial → fetch lifecycle → download PDF
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8 space-y-6">
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Serial Number</label>
              <input
                value={serialNo}
                onChange={(e) => setSerialNo(e.target.value)}
                placeholder="Enter serial number"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Page</label>
              <input
                type="number"
                min={1}
                value={page}
                onChange={(e) => setPage(parseInt(e.target.value || '1', 10))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Limit</label>
              <input
                type="number"
                min={1}
                max={500}
                value={limit}
                onChange={(e) => setLimit(parseInt(e.target.value || '25', 10))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={onFetch}
              disabled={state === 'loading'}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
            >
              {state === 'loading' ? 'Fetching…' : 'Fetch Lifecycle'}
            </button>
            <button
              onClick={onDownload}
              disabled={loadingPdf}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-slate-800 hover:bg-slate-50 disabled:opacity-60"
            >
              {loadingPdf ? 'Preparing PDF…' : 'Download PDF'}
            </button>
            {error && <span className="text-sm text-red-600">{error}</span>}
          </div>
        </section>

        {state === 'success' && hasData && (
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-slate-900">Device</h2>
                <p className="text-sm text-slate-600">Serial: <span className="font-medium text-slate-900">{device.serialNo}</span></p>
                <p className="text-sm text-slate-600">Name: {device.name || '—'}</p>
                <p className="text-sm text-slate-600">Model: {device.model_no || '—'}</p>
                <p className="text-sm text-slate-600">Company: {device.company || '—'}</p>
                <p className="text-sm text-slate-600">Vital: {device.vital || '—'}</p>
                <p className="text-sm text-slate-600">Status: {device.status || '—'} • Active: {String(device.active)}</p>
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-slate-900">Current Assignment</h2>
                <p className="text-sm text-slate-600">Clinic: {current?.clinic?.name || '—'}</p>
                <p className="text-sm text-slate-600">Sub Clinic: {current?.subClinic?.name || '—'}</p>
                <p className="text-sm text-slate-600">Distributor: {current?.distributor?.name || '—'}</p>
                <p className="text-sm text-slate-600">Patient: {current?.patient?.name || '—'}</p>
                <p className="text-sm text-slate-600">Kit: {current?.kit?.id || '—'}</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <h3 className="text-md font-semibold text-slate-900">Subscription</h3>
                <p className="text-sm text-slate-600">Type: {subscription?.subscriptionType || '—'}</p>
                <p className="text-sm text-slate-600">Charge: {subscription?.subscriptionCharge ?? '—'}</p>
                <p className="text-sm text-slate-600">ECG Type: {subscription?.ecgType || '—'}</p>
                <p className="text-sm text-slate-600">Plan: {subscription?.durationWisePlan || '—'}</p>
                <p className="text-sm text-slate-600">Clinic: {subscription?.clinicName || '—'}</p>
              </div>
              <div className="space-y-1">
                <h3 className="text-md font-semibold text-slate-900">History Window</h3>
                <p className="text-sm text-slate-600">
                  From: {result?.historyWindow?.from ? formatDate(result.historyWindow.from) : '—'}
                </p>
                <p className="text-sm text-slate-600">
                  To: {result?.historyWindow?.to ? formatDate(result.historyWindow.to) : '—'}
                </p>
                <p className="text-sm text-slate-600">
                  Records: {result?.historyPagination?.total ?? history.length}
                </p>
                <p className="text-sm text-slate-600">
                  Page: {result?.historyPagination?.page ?? page} / {result?.historyPagination?.pages ?? 1}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <th className="px-3 py-2 text-left">Date</th>
                    <th className="px-3 py-2 text-left">Type</th>
                    <th className="px-3 py-2 text-left">Details</th>
                    <th className="px-3 py-2 text-left">Reason</th>
                    <th className="px-3 py-2 text-left">Created By</th>
                    <th className="px-3 py-2 text-left">Updated By</th>
                  </tr>
                </thead>
                <tbody>
                  {history.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-3 py-3 text-center text-slate-500">
                        No history found.
                      </td>
                    </tr>
                  )}
                  {history.map((row: any, idx: number) => (
                    <tr key={idx} className="border-t border-slate-200">
                      <td className="px-3 py-2">{formatDate(row?.date)}</td>
                      <td className="px-3 py-2">{row?.type || '—'}</td>
                      <td className="px-3 py-2">{row?.details || '—'}</td>
                      <td className="px-3 py-2">{row?.reason || '—'}</td>
                      <td className="px-3 py-2">{row?.createdBy?.name || row?.createdBy?.email || row?.createdBy?.id || '—'}</td>
                      <td className="px-3 py-2">{row?.updatedBy?.name || row?.updatedBy?.email || row?.updatedBy?.id || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => fetchLifecycle(Math.max((result?.historyPagination?.page ?? page) - 1, 1))}
                disabled={(result?.historyPagination?.page ?? page) <= 1 || isLoading}
                className="inline-flex items-center rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-60"
              >
                Previous
              </button>
              <button
                onClick={() => {
                  const currentPage = result?.historyPagination?.page ?? page;
                  const totalPages = result?.historyPagination?.pages ?? 1;
                  const nextPage = Math.min(currentPage + 1, totalPages);
                  fetchLifecycle(nextPage);
                }}
                disabled={
                  (result?.historyPagination?.page ?? page) >= (result?.historyPagination?.pages ?? 1) ||
                  isLoading
                }
                className="inline-flex items-center rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-60"
              >
                Next
              </button>
              <span className="text-sm text-slate-600">
                Showing {(result?.historyPagination?.page ?? page)} / {(result?.historyPagination?.pages ?? 1)}
              </span>
            </div>
          </section>
        )}

        {state === 'error' && !hasData && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            {error || 'Something went wrong.'}
          </div>
        )}
      </main>
    </div>
  );
}
