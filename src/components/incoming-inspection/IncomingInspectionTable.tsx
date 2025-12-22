"use client";

import { useCallback } from 'react';
import Link from 'next/link';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { incomingInspectionsApi } from '@/lib/api/endpoints/incomingInspections';
import { useIncomingInspectionList } from '@/hooks/api/useIncomingInspections';
import { COMPONENT_LABELS } from './constants';
import { showApiErrorToast } from '@/lib/utils';

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export function IncomingInspectionTable() {
  const { data, isLoading } = useIncomingInspectionList({
    page_index: 1,
    page_size: 20,
    sort_by: 'updated_at',
    sort_order: -1,
  });

  const handleDownload = useCallback(async (id: string) => {
    try {
      const blob = await incomingInspectionsApi.downloadPdf(id);
      downloadBlob(blob, `incoming-inspection-${id}.pdf`);
    } catch (error) {
      showApiErrorToast(error);
    }
  }, []);

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading inspections...</div>;
  }

  if (!data?.list?.length) {
    return <div className="text-sm text-muted-foreground">No inspections found.</div>;
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-4 py-3 text-left">Component</th>
            <th className="px-4 py-3 text-left">Material</th>
            <th className="px-4 py-3 text-left">Batch/Lot</th>
            <th className="px-4 py-3 text-left">Inward Date</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.list.map((record) => {
            const primary = record.components?.[0];
            const label = primary?.component_type ? COMPONENT_LABELS[primary.component_type] : '—';
            const details = primary?.details;
            return (
              <tr key={record._id} className="border-t">
                <td className="px-4 py-3">
                  <Link
                    className="font-medium text-primary hover:underline"
                    href={`/dashboard/incoming-inspections/${record._id}`}
                  >
                    {label}
                  </Link>
                </td>
                <td className="px-4 py-3">{details?.material_name ?? '—'}</td>
                <td className="px-4 py-3">{details?.batch_lot_no ?? '—'}</td>
                <td className="px-4 py-3">
                  {details?.inward_date ? new Date(details.inward_date).toLocaleDateString() : '—'}
                </td>
                <td className="px-4 py-3">{record.status ?? 'DRAFT'}</td>
                <td className="px-4 py-3 text-right">
                  <Button variant="ghost" size="sm" onClick={() => handleDownload(record._id)}>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
