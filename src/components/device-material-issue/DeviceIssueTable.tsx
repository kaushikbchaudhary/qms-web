"use client"

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ColumnDef } from '@tanstack/react-table';
import CustomizableTable, { useTableState } from '@/components/shared/CustomizableTable';
import { DeviceMaterialIssue, DeviceMaterialIssueQueryParams } from '@/lib/api/types/deviceMaterialIssue';
import { useDeviceMaterialIssueList } from '@/hooks/api/useDeviceMaterialIssues';
import { showApiErrorToast } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const getCustomFieldString = (issue: DeviceMaterialIssue, key: string): string | undefined => {
  const raw = issue.custom_fields?.[key];
  if (typeof raw !== 'string') {
    return undefined;
  }
  const value = raw.trim();
  return value.length > 0 ? value : undefined;
};

const getCustomFieldDate = (issue: DeviceMaterialIssue, key: string): string | Date | undefined => {
  const raw = issue.custom_fields?.[key];
  if (raw instanceof Date) {
    return raw;
  }
  if (typeof raw === 'string' && raw.trim().length > 0) {
    return raw;
  }
  return undefined;
};

const formatDateValue = (value?: string | Date | null): string | undefined => {
  if (!value) {
    return undefined;
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }
  return format(date, 'dd MMM yyyy');
};

const resolveSignatureUrl = (path?: string | null): string | undefined => {
  if (!path) return undefined;
  if (/^(https?:)?\/\//i.test(path)) {
    return path;
  }
  const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
  const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
};

const resolveName = (input: unknown): string | undefined => {
  if (!input) return undefined;
  if (typeof input === 'string') {
    const trimmed = input.trim();
    return trimmed.length ? trimmed : undefined;
  }
  if (typeof input === 'object') {
    const person = input as any;
    const parts = [person?.firstName, person?.middleName, person?.lastName].filter(Boolean);
    if (parts.length) {
      return parts.join(' ').trim();
    }
    if (typeof person?.emailId === 'string' && person.emailId.trim()) {
      return person.emailId.trim();
    }
    if (typeof person?._id === 'string') {
      return person._id;
    }
  }
  return undefined;
};

const renderSignatureCell = (
  signaturePath?: string | null,
  signedAt?: string | Date | null,
  name?: unknown,
) => {
  const resolvedName = resolveName(name);
  const dateText = formatDateValue(signedAt);

  if (!signaturePath && !resolvedName && !dateText) {
    return '—';
  }

  const url = resolveSignatureUrl(signaturePath);

  return (
    <div className="flex flex-col items-start gap-1">
      {url ? (
        <img
          src={url}
          alt={resolvedName ? `${resolvedName} signature` : 'Signature'}
          className="h-10 w-auto max-w-[140px] rounded border bg-white object-contain"
        />
      ) : null}
      {dateText ? <span className="text-xs text-muted-foreground">{dateText}</span> : null}
      {resolvedName ? <span className="text-xs font-medium text-foreground">{resolvedName}</span> : null}
    </div>
  );
};

export function DeviceIssueTable() {
  const { pagination, setPagination } = useTableState(20);

  const queryParams: DeviceMaterialIssueQueryParams = useMemo(
    () => ({
      page_index: pagination.pageIndex + 1,
      page_size: pagination.pageSize,
      sort_by: 'progress_metadata.requested_on',
      sort_order: -1,
    }),
    [pagination.pageIndex, pagination.pageSize],
  );

  const { data, isLoading, isError, error } = useDeviceMaterialIssueList(queryParams);

  useEffect(() => {
    if (isError && error) {
      showApiErrorToast(error);
    }
  }, [isError, error]);

  const baseRowNumber = pagination.pageIndex * pagination.pageSize;

  const columns = useMemo<ColumnDef<DeviceMaterialIssue>[]>(
    () => [
      {
        id: 'sr-no',
        header: 'Sr No.',
        enableSorting: false,
        cell: ({ row }) => baseRowNumber + row.index + 1,
      },
      {
        accessorKey: 'device_details.category',
        header: 'Device/Material name',
        enableSorting: false,
        cell: ({ row }) => row.original.device_details?.category || '—',
      },
      {
        accessorKey: 'device_details.model',
        header: 'Model no.',
        enableSorting: false,
        cell: ({ row }) => row.original.device_details?.model || '—',
      },
      {
        accessorKey: 'purpose.description',
        header: 'Purpose',
        enableSorting: false,
        cell: ({ row }) => row.original.purpose?.description || '—',
      },
      {
        id: 'required-quantity',
        header: 'Required quantity',
        enableSorting: false,
        cell: ({ row }) => row.original.device_details?.quantity ?? '—',
      },
      {
        id: 'requested-by',
        header: 'Requested by (sign & date)',
        enableSorting: false,
        cell: ({ row }) => {
          const request = row.original;
          const name =
            getCustomFieldString(request, 'requested_by_name') ?? request.requester_snapshot?.name;
          const signedAt =
            getCustomFieldDate(request, 'requested_by_signed_at') ?? request.progress_metadata?.requested_on;
          const signaturePath = getCustomFieldString(request, 'requested_by_signature_path');
          return renderSignatureCell(signaturePath, signedAt, name);
        },
      },
      {
        id: 'batch-number',
        header: 'Batch/Lot no. of issued material',
        enableSorting: false,
        cell: ({ row }) =>
          row.original.production?.batch_number ||
          row.original.device_details?.serial_number ||
          '—',
      },
      {
        id: 'issued-by',
        header: 'Issued by (sign & date)',
        enableSorting: false,
        cell: ({ row }) => {
          const pickup = row.original.pickup;
          return renderSignatureCell(pickup?.store_signature_path, pickup?.store_signed_at ?? null, pickup?.store_signed_name);
        },
      },
      {
        id: 'received-by',
        header: 'Received by (sign & date)',
        enableSorting: false,
        cell: ({ row }) => {
          const recipient = row.original.recipient;
          return renderSignatureCell(recipient?.signature_path, recipient?.signed_at ?? null, recipient?.name);
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        enableSorting: false,
        cell: ({ row }) => (
          <Link href={`/dashboard/device-material-issues/${row.original._id}`}>
            <Button variant="outline" size="sm">
              View
            </Button>
          </Link>
        ),
      },
    ],
    [baseRowNumber],
  );

  const issues = data?.list ?? [];

  return (
    <div className="w-full">
      <CustomizableTable<DeviceMaterialIssue, unknown>
        columns={columns}
        data={issues}
        totalItems={data?.count ?? 0}
        isLoading={isLoading}
        pagination={pagination}
        onPaginationChange={setPagination}
        showColumnVisibilityToggle={false}
        options={{ manualPagination: true, pageSizeOptions: [10, 20, 50, 100] }}
      />
    </div>
  );
}
