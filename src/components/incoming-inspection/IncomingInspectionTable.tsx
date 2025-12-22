"use client";

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { Download, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { incomingInspectionsApi } from '@/lib/api/endpoints/incomingInspections';
import { useIncomingInspectionList } from '@/hooks/api/useIncomingInspections';
import { COMPONENT_LABELS } from './constants';
import { showApiErrorToast } from '@/lib/utils';
import { IncomingInspectionComponentType, IncomingInspectionQueryParams } from '@/lib/api/types/incomingInspection';

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
  const [filters, setFilters] = useState({
    formNumber: '',
    componentType: 'ALL' as IncomingInspectionComponentType | 'ALL',
    materialName: '',
    batchLot: '',
    dateFrom: '',
    dateTo: '',
  });

  const queryParams = useMemo<IncomingInspectionQueryParams>(() => {
    const fieldFilters: IncomingInspectionQueryParams['filters'] = [];

    if (filters.formNumber.trim()) {
      fieldFilters.push({
        field: 'form_number',
        operator: 'in',
        subType: 'string',
        value: filters.formNumber.trim(),
      });
    }

    if (filters.componentType !== 'ALL') {
      fieldFilters.push({
        field: 'components.component_type',
        operator: 'eq',
        value: filters.componentType,
      });
    }

    if (filters.materialName.trim()) {
      fieldFilters.push({
        field: 'components.details.material_name',
        operator: 'in',
        subType: 'string',
        value: filters.materialName.trim(),
      });
    }

    if (filters.batchLot.trim()) {
      fieldFilters.push({
        field: 'components.details.batch_lot_no',
        operator: 'in',
        subType: 'string',
        value: filters.batchLot.trim(),
      });
    }

    if (filters.dateFrom && filters.dateTo) {
      fieldFilters.push({
        field: 'components.details.inward_date',
        operator: 'ltegte',
        subType: 'date',
        value: { min: filters.dateFrom, max: filters.dateTo },
      });
    } else if (filters.dateFrom) {
      fieldFilters.push({
        field: 'components.details.inward_date',
        operator: 'gte',
        subType: 'date',
        value: filters.dateFrom,
      });
    } else if (filters.dateTo) {
      fieldFilters.push({
        field: 'components.details.inward_date',
        operator: 'lte',
        subType: 'date',
        value: filters.dateTo,
      });
    }

    return {
      page_index: 1,
      page_size: 20,
      sort_by: 'updated_at',
      sort_order: -1,
      ...(fieldFilters.length ? { filters: fieldFilters } : {}),
    };
  }, [filters]);

  const { data, isLoading } = useIncomingInspectionList(queryParams);

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
    return (
      <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
        No inspections found.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-white">
      <div className="border-b bg-muted/20 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">Inspection records</div>
            <div className="text-xs text-muted-foreground">
              Showing {data.list.length} of {data.count} inspections
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setFilters({
                formNumber: '',
                componentType: 'ALL',
                materialName: '',
                batchLot: '',
                dateFrom: '',
                dateTo: '',
              })
            }
          >
            Clear filters
          </Button>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <div className="space-y-1">
            <div className="text-xs font-medium text-muted-foreground">Form number</div>
            <Input
              placeholder="Search form no."
              value={filters.formNumber}
              onChange={(e) => setFilters((prev) => ({ ...prev, formNumber: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <div className="text-xs font-medium text-muted-foreground">Component type</div>
            <Select
              value={filters.componentType}
              onValueChange={(value) =>
                setFilters((prev) => ({ ...prev, componentType: value as IncomingInspectionComponentType | 'ALL' }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All components" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                {Object.entries(COMPONENT_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <div className="text-xs font-medium text-muted-foreground">Material name</div>
            <Input
              placeholder="Search material"
              value={filters.materialName}
              onChange={(e) => setFilters((prev) => ({ ...prev, materialName: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <div className="text-xs font-medium text-muted-foreground">Batch/Lot</div>
            <Input
              placeholder="Search batch/lot"
              value={filters.batchLot}
              onChange={(e) => setFilters((prev) => ({ ...prev, batchLot: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <div className="text-xs font-medium text-muted-foreground">Inward date from</div>
            <Input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <div className="text-xs font-medium text-muted-foreground">Inward date to</div>
            <Input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters((prev) => ({ ...prev, dateTo: e.target.value }))}
            />
          </div>
        </div>
      </div>
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-[11px] uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3 text-left">Form</th>
            <th className="px-4 py-3 text-left">Primary component</th>
            <th className="px-4 py-3 text-left">Material</th>
            <th className="px-4 py-3 text-left">Batch/Lot</th>
            <th className="px-4 py-3 text-left">Inward date</th>
            <th className="px-4 py-3 text-left">Components</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.list.map((record) => {
            const primary = record.components?.[0];
            const label = primary?.component_type ? COMPONENT_LABELS[primary.component_type] : '—';
            const details = primary?.details;
            const status = record.status ?? 'DRAFT';
            const badgeStyle =
              status === 'FINALIZED'
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-amber-50 text-amber-700';
            return (
              <tr key={record._id} className="border-t">
                <td className="px-4 py-3 font-medium">{record.form_number ?? '—'}</td>
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
                <td className="px-4 py-3">{record.components?.length ?? 0}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${badgeStyle}`}>
                    {status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/dashboard/incoming-inspections/${record._id}`}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Update
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDownload(record._id)}>
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
