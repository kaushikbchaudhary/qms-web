"use client"

import { useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { ColumnDef } from '@tanstack/react-table';
import CustomizableTable, { useTableState } from '@/components/shared/CustomizableTable';
import { DeviceMaterialIssue, DeviceMaterialIssueQueryParams } from '@/lib/api/types/deviceMaterialIssue';
import { useDeviceMaterialIssueList } from '@/hooks/api/useDeviceMaterialIssues';
import { showApiErrorToast } from '@/lib/utils';

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

const formatSignatureCell = (name?: string | null, signedAt?: string | Date | null): string => {
  const trimmedName = name?.trim();
  const dateText = formatDateValue(signedAt);
  if (trimmedName && dateText) {
    return `${trimmedName} • ${dateText}`;
  }
  if (trimmedName) {
    return trimmedName;
  }
  if (dateText) {
    return dateText;
  }
  return '—';
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
          return formatSignatureCell(name, signedAt);
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
          return formatSignatureCell(pickup?.store_signed_name, pickup?.store_signed_at ?? null);
        },
      },
      {
        id: 'received-by',
        header: 'Received by (sign & date)',
        enableSorting: false,
        cell: ({ row }) => {
          const recipient = row.original.recipient;
          return formatSignatureCell(recipient?.name, recipient?.signed_at ?? null);
        },
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
