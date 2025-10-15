"use client"

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import CustomizableTable, { useTableState } from '@/components/shared/CustomizableTable';
import {
  DeviceMaterialIssue,
  DeviceMaterialIssuePriority,
  DeviceMaterialIssueStatus,
  DeviceMaterialIssueQueryParams,
} from '@/lib/api/types/deviceMaterialIssue';
import { useDeviceMaterialIssueList } from '@/hooks/api/useDeviceMaterialIssues';
import { useDebounce } from '@/hooks/debounceHook';
import { showApiErrorToast } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type StatusFilterValue = 'ALL' | DeviceMaterialIssueStatus;
type PriorityFilterValue = 'ALL' | DeviceMaterialIssuePriority;

const STATUS_OPTIONS: { value: StatusFilterValue; label: string }[] = [
  { value: 'ALL', label: 'All statuses' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'UNDER_REVIEW', label: 'Under review' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'IN_PRODUCTION', label: 'In production' },
  { value: 'READY_FOR_PICKUP', label: 'Ready for pickup' },
  { value: 'ISSUED', label: 'Issued' },
  { value: 'CLOSED', label: 'Closed' },
  { value: 'REJECTED', label: 'Rejected' },
];

const PRIORITY_OPTIONS: { value: PriorityFilterValue; label: string }[] = [
  { value: 'ALL', label: 'All priorities' },
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'URGENT', label: 'Urgent' },
];

const STATUS_BADGE_VARIANTS: Record<DeviceMaterialIssueStatus, string> = {
  DRAFT: 'outline',
  SUBMITTED: 'secondary',
  UNDER_REVIEW: 'secondary',
  APPROVED: 'default',
  IN_PRODUCTION: 'default',
  READY_FOR_PICKUP: 'default',
  ISSUED: 'default',
  CLOSED: 'outline',
  REJECTED: 'destructive',
};

const PRIORITY_BADGE_CLASSES: Record<DeviceMaterialIssuePriority, string> = {
  LOW: 'bg-muted text-muted-foreground',
  MEDIUM: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  HIGH: 'bg-orange-100 text-orange-900 dark:bg-orange-900 dark:text-orange-200',
  URGENT: 'bg-red-500 text-white hover:bg-red-600',
};

const formatDate = (value?: string) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return format(date, 'dd MMM yyyy');
};

export function DeviceIssueTable() {
  const tableState = useTableState(20);
  const {
    pagination,
    setPagination,
    sorting,
    setSorting,
    columnFilters,
    setColumnFilters,
    columnVisibility,
    setColumnVisibility,
    rowSelection,
    setRowSelection,
  } = tableState;

  const [globalFilter, setGlobalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilterValue>('ALL');

  const debouncedSearch = useDebounce(globalFilter, 400);

  const queryParams: DeviceMaterialIssueQueryParams = useMemo(
    () => ({
      page_index: pagination.pageIndex + 1,
      page_size: pagination.pageSize,
      global_value: debouncedSearch || undefined,
      global_filter: debouncedSearch
        ? ['request_number', 'device_details.category', 'purpose.description']
        : undefined,
      status: statusFilter === 'ALL' ? undefined : statusFilter,
      priority: priorityFilter === 'ALL' ? undefined : priorityFilter,
      sort_by: sorting[0]?.id ?? 'progress_metadata.requested_on',
      sort_order: sorting[0]?.desc ? -1 : 1,
    }),
    [pagination.pageIndex, pagination.pageSize, debouncedSearch, statusFilter, priorityFilter, sorting],
  );

  const { data, isLoading, isError, error, refetch } = useDeviceMaterialIssueList(queryParams);

  useEffect(() => {
    if (isError && error) {
      showApiErrorToast(error);
    }
  }, [isError, error]);

  const columns = useMemo<ColumnDef<DeviceMaterialIssue>[]>(
    () => [
      {
        accessorKey: 'request_number',
        header: 'Request #',
        cell: ({ row }) => (
          <Link
            href={`/dashboard/device-material-issues/${row.original._id}`}
            className="font-medium text-primary hover:underline"
          >
            {row.original.request_number}
          </Link>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const variant = STATUS_BADGE_VARIANTS[row.original.status];
          return (
            <Badge variant={variant as any}>
              {row.original.status.replace(/_/g, ' ')}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'priority',
        header: 'Priority',
        cell: ({ row }) => (
          <Badge className={PRIORITY_BADGE_CLASSES[row.original.priority]}>
            {row.original.priority}
          </Badge>
        ),
      },
      {
        accessorKey: 'device_details.category',
        header: 'Category',
        cell: ({ row }) => row.original.device_details?.category ?? '—',
      },
      {
        accessorKey: 'device_details.quantity',
        header: 'Qty',
        cell: ({ row }) => `${row.original.device_details?.quantity ?? '—'} ${row.original.device_details?.unit ?? ''}`.trim(),
      },
      {
        accessorKey: 'purpose.description',
        header: 'Purpose',
        cell: ({ row }) => (
          <span className="line-clamp-2 text-sm text-muted-foreground">
            {row.original.purpose?.description ?? '—'}
          </span>
        ),
      },
      {
        id: 'requested_on',
        header: 'Requested',
        cell: ({ row }) => formatDate(row.original.progress_metadata?.requested_on ?? row.original.created_at),
      },
      {
        id: 'ready_for_pickup_at',
        header: 'Ready for pickup',
        cell: ({ row }) => formatDate(row.original.progress_metadata?.ready_for_pickup_at),
      },
    ],
    [],
  );

  const tableData = data?.list ?? [];

  return (
    <div className="space-y-4 w-full">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3 w-full">
          <Input
            value={globalFilter}
            onChange={(event) => setGlobalFilter(event.target.value)}
            placeholder="Search by request #, category, or purpose"
            className="md:w-80"
          />
          <Select value={statusFilter} onValueChange={(value: StatusFilterValue) => setStatusFilter(value)}>
            <SelectTrigger className="md:w-56">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={priorityFilter}
            onValueChange={(value: PriorityFilterValue) => setPriorityFilter(value)}
          >
            <SelectTrigger className="md:w-48">
              <SelectValue placeholder="Filter priority" />
            </SelectTrigger>
            <SelectContent>
              {PRIORITY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" onClick={() => refetch()} className="w-full md:w-auto">
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh
        </Button>
      </div>

      <CustomizableTable<DeviceMaterialIssue, unknown>
        columns={columns}
        data={tableData}
        totalItems={data?.count ?? 0}
        isLoading={isLoading}
        pagination={pagination}
        onPaginationChange={setPagination}
        sorting={sorting}
        onSortingChange={setSorting}
        columnFilters={columnFilters}
        onColumnFiltersChange={setColumnFilters}
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={setColumnVisibility}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        options={{ manualPagination: true, manualSorting: true, pageSizeOptions: [10, 20, 50, 100] }}
      />
    </div>
  );
}
