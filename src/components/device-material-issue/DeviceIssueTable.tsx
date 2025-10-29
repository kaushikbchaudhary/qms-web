"use client"

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ColumnDef } from '@tanstack/react-table';
import CustomizableTable, { useTableState } from '@/components/shared/CustomizableTable';
import { DeviceMaterialIssue, DeviceMaterialIssueQueryParams } from '@/lib/api/types/deviceMaterialIssue';
import { useDeviceMaterialIssueList } from '@/hooks/api/useDeviceMaterialIssues';
import { showApiErrorToast } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { deviceMaterialIssuesApi } from '@/lib/api/endpoints/deviceMaterialIssues';
import { useAuthStore } from '@/stores/authStore';
import { roles } from '@/config/roles';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

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

const renderSignatureStatus = ({
  signaturePath,
  signedAt,
  name,
}: {
  signaturePath?: string | null;
  signedAt?: string | Date | null;
  name?: unknown;
}) => {
  const resolvedName = resolveName(name);
  const status = signaturePath ? 'Signed' : 'Unsigned';
  const dateText = formatDateValue(signedAt);

  if (!resolvedName && !dateText && !signaturePath) {
    return 'Unsigned';
  }

  return (
    <div className="flex flex-col items-start gap-0.5">
      <span className="text-xs font-medium text-foreground">{status}</span>
      {resolvedName ? <span className="text-xs text-muted-foreground">{resolvedName}</span> : null}
      {dateText ? <span className="text-xs text-muted-foreground">{dateText}</span> : null}
    </div>
  );
};

const STATUS_FILTERS: Array<{
  key: 'SUBMITTED' | 'READY_FOR_PICKUP' | 'ISSUED';
  label: string;
}> = [
  { key: 'SUBMITTED', label: 'Submitted' },
  { key: 'READY_FOR_PICKUP', label: 'Available in store' },
  { key: 'ISSUED', label: 'Received' },
];

const STATUS_FILTER_CONFIG: Record<
  'SUBMITTED' | 'READY_FOR_PICKUP' | 'ISSUED',
  {
    status?: 'SUBMITTED' | 'READY_FOR_PICKUP' | 'ISSUED';
    filters?: DeviceMaterialIssueQueryParams['filters'];
  }
> = {
  SUBMITTED: {
    status: 'SUBMITTED',
  },
  READY_FOR_PICKUP: {
    status: 'READY_FOR_PICKUP',
  },
  ISSUED: {
    status: 'ISSUED',
  },
};

const STORE_ROLE_ALIASES = [roles.STORE_INVENTORY, 'store & inventory'];

export function DeviceIssueTable() {
  const { user } = useAuthStore();
  const userRoles = user?.role ?? [];
  const isSuperAdmin = userRoles.includes(roles.SUPER_ADMIN);
  const isStoreUser = userRoles.some((roleKey) => STORE_ROLE_ALIASES.includes(roleKey));
  const restrictToSelf = !isSuperAdmin && !isStoreUser ? user?._id : undefined;

  const { pagination, setPagination } = useTableState(20);
  const [statusFilter, setStatusFilter] = useState<'SUBMITTED' | 'READY_FOR_PICKUP' | 'ISSUED'>('SUBMITTED');
  const [isBatchDialogOpen, setBatchDialogOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<DeviceMaterialIssue | null>(null);
  const [batchInput, setBatchInput] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const queryParams: DeviceMaterialIssueQueryParams = useMemo(
    () => ({
      page_index: pagination.pageIndex + 1,
      page_size: pagination.pageSize,
      sort_by: 'progress_metadata.requested_on',
      sort_order: isStoreUser ? 1 : -1,
      ...(STATUS_FILTER_CONFIG[statusFilter].status
        ? { status: STATUS_FILTER_CONFIG[statusFilter].status }
        : {}),
      ...(restrictToSelf ? { requested_by: restrictToSelf } : {}),
      ...(STATUS_FILTER_CONFIG[statusFilter].filters
        ? { filters: STATUS_FILTER_CONFIG[statusFilter].filters }
        : {}),
    }),
    [pagination.pageIndex, pagination.pageSize, statusFilter, isStoreUser, restrictToSelf],
  );

  const { data, isLoading, isError, error } = useDeviceMaterialIssueList(queryParams);

  useEffect(() => {
    if (isError && error) {
      showApiErrorToast(error);
    }
  }, [isError, error]);

  useEffect(() => {
    setPagination((prev) => ({
      ...prev,
      pageIndex: 0,
    }));
  }, [setPagination, statusFilter]);

  const queryClient = useQueryClient();
  const storeSignoffMutation = useMutation({
    mutationFn: async ({ issueId, batchNumber }: { issueId: string; batchNumber: string }) =>
      deviceMaterialIssuesApi.storeIssue(issueId, { batch_number: batchNumber }),
    onSuccess: async () => {
      toast.success('Batch number saved.');
      setBatchDialogOpen(false);
      setSelectedIssue(null);
      setBatchInput('');
      await queryClient.invalidateQueries({ queryKey: ['device-material-issues'] });
    },
    onError: (error) => {
      showApiErrorToast(error);
    },
  });

  const handleExport = useCallback(async () => {
    if (!isSuperAdmin || statusFilter !== 'ISSUED') {
      return;
    }

    try {
      setIsExporting(true);
      const exportPayload = {
        status: queryParams.status,
        priority: queryParams.priority,
        requested_by: queryParams.requested_by,
        filters: queryParams.filters,
        global_filter: queryParams.global_filter,
        global_value: queryParams.global_value,
        sort_by: queryParams.sort_by,
        sort_order: queryParams.sort_order,
      };

      const blob = await deviceMaterialIssuesApi.downloadListPdf(exportPayload);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const timestamp = new Date().toISOString().slice(0, 10);
      link.download = `device-material-issues-${statusFilter.toLowerCase()}-${timestamp}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      showApiErrorToast(error);
    } finally {
      setIsExporting(false);
    }
  }, [isSuperAdmin, statusFilter, queryParams]);

  const handleRowSelect = useCallback(
    (issue: DeviceMaterialIssue, rowIndex: number) => {
      if (!isStoreUser || statusFilter !== 'SUBMITTED') {
        return;
      }
      if (rowIndex > 0) {
        toast.info('Complete earlier requests before processing the next one.');
        return;
      }
      setSelectedIssue(issue);
      setBatchInput(issue.production?.batch_number ?? '');
      setBatchDialogOpen(true);
    },
    [isStoreUser, statusFilter],
  );

  const resolveRowClassName = useCallback(
    (_issue: DeviceMaterialIssue, rowIndex: number) => {
      if (!isStoreUser || statusFilter !== 'SUBMITTED') {
        return '';
      }
      return rowIndex === 0 ? '' : 'cursor-not-allowed opacity-60';
    },
    [isStoreUser, statusFilter],
  );

  const handleBatchSubmit = useCallback(async () => {
    if (!selectedIssue) {
      return;
    }
    const trimmed = batchInput.trim();
    if (!trimmed) {
      toast.error('Batch or lot number is required.');
      return;
    }
    await storeSignoffMutation.mutateAsync({ issueId: selectedIssue._id, batchNumber: trimmed });
  }, [batchInput, selectedIssue, storeSignoffMutation]);

  const handleDialogClose = useCallback(() => {
    if (storeSignoffMutation.isPending) {
      return;
    }
    setBatchDialogOpen(false);
    setSelectedIssue(null);
    setBatchInput('');
  }, [storeSignoffMutation.isPending]);

  const baseRowNumber = pagination.pageIndex * pagination.pageSize;

  const columns = useMemo<ColumnDef<DeviceMaterialIssue>[]>(
    () => {
      const resolvedLockedMessage = 'Locked until older requests are fulfilled.';
      const columnDefs: ColumnDef<DeviceMaterialIssue>[] = [
        {
          id: 'sr-no',
          header: 'Sr No.',
          enableSorting: false,
          cell: ({ row }) => baseRowNumber + row.index + 1,
        },
        {
          accessorKey: 'request_number',
          header: 'Request #',
          enableSorting: false,
          cell: ({ row }) => row.original.request_number ?? '—',
        },
        {
          accessorKey: 'device_details.category',
          header: 'Device/Material name',
          enableSorting: false,
          cell: ({ row }) => {
            const request = row.original;
            const hideDetails = isStoreUser && statusFilter === 'SUBMITTED' && row.index > 0;
            if (hideDetails) {
              return (
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-muted-foreground">
                    Request {request.request_number}
                  </span>
                  <span className="text-xs text-muted-foreground">{resolvedLockedMessage}</span>
                </div>
              );
            }

            const category = request.device_details?.category;
            if (!category) {
              return '—';
            }
            return (
              <div className="flex flex-col">
                {isStoreUser ? (
                  <span className="text-sm font-medium text-foreground">{category}</span>
                ) : (
                  <Link
                    href={`/dashboard/device-material-issues/${request._id}`}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    {category}
                  </Link>
                )}
              </div>
            );
          },
        },
        {
          accessorKey: 'device_details.model',
          header: 'Model no.',
          enableSorting: false,
          cell: ({ row }) => {
            const hideDetails = isStoreUser && statusFilter === 'SUBMITTED' && row.index > 0;
            if (hideDetails) {
              return <span className="text-xs text-muted-foreground">{resolvedLockedMessage}</span>;
            }
            const { model } = row.original.device_details ?? {};
            if (!model) {
              return '—';
            }
            return <span>{model}</span>;
          },
        },
        {
          accessorKey: 'purpose.description',
          header: 'Purpose',
          enableSorting: false,
          cell: ({ row }) => {
            const hideDetails = isStoreUser && statusFilter === 'SUBMITTED' && row.index > 0;
            if (hideDetails) {
              return <span className="text-xs text-muted-foreground">{resolvedLockedMessage}</span>;
            }
            return row.original.purpose?.description || '—';
          },
        },
        {
          id: 'required-quantity',
          header: 'Required quantity',
          enableSorting: false,
          cell: ({ row }) => {
            const hideDetails = isStoreUser && statusFilter === 'SUBMITTED' && row.index > 0;
            if (hideDetails) {
              return <span className="text-xs text-muted-foreground">—</span>;
            }
            const { quantity } = row.original.device_details ?? {};
            if (quantity === undefined || quantity === null) {
              return '—';
            }
            return `${quantity}`;
          },
        },
        {
          id: 'requested-by',
          header: 'Requested by (sign & date)',
          enableSorting: false,
          cell: ({ row }) => {
            const hideDetails = isStoreUser && statusFilter === 'SUBMITTED' && row.index > 0;
            if (hideDetails) {
              return <span className="text-xs text-muted-foreground">{resolvedLockedMessage}</span>;
            }
            const request = row.original;
            const name =
              getCustomFieldString(request, 'requested_by_name') ?? request.requester_snapshot?.name;
            const signedAt =
              getCustomFieldDate(request, 'requested_by_signed_at') ?? request.progress_metadata?.requested_on;
            const signaturePath = getCustomFieldString(request, 'requested_by_signature_path');
            return renderSignatureStatus({ signaturePath, signedAt, name });
          },
        },
        {
          id: 'batch-number',
          header: 'Batch/Lot no. of issued material',
          enableSorting: false,
          cell: ({ row }) => {
            const hideDetails = isStoreUser && statusFilter === 'SUBMITTED' && row.index > 0;
            if (hideDetails) {
              return <span className="text-xs text-muted-foreground">—</span>;
            }
            return row.original.production?.batch_number || '—';
          },
        },
        {
          id: 'issued-by',
          header: 'Issued by (sign & date)',
          enableSorting: false,
          cell: ({ row }) => {
            const hideDetails = isStoreUser && statusFilter === 'SUBMITTED' && row.index > 0;
            if (hideDetails) {
              return <span className="text-xs text-muted-foreground">{resolvedLockedMessage}</span>;
            }
            const pickup = row.original.pickup;
            return renderSignatureStatus({
              signaturePath: pickup?.store_signature_path,
              signedAt: pickup?.store_signed_at ?? pickup?.issued_at ?? null,
              name: pickup?.store_signed_name ?? pickup?.issued_by,
            });
          },
        },
        {
          id: 'received-by',
          header: 'Received by (sign & date)',
          enableSorting: false,
          cell: ({ row }) => {
            const hideDetails = isStoreUser && statusFilter === 'SUBMITTED' && row.index > 0;
            if (hideDetails) {
              return <span className="text-xs text-muted-foreground">{resolvedLockedMessage}</span>;
            }
            const recipient = row.original.recipient;
            return renderSignatureStatus({
              signaturePath: recipient?.signature_path,
              signedAt: recipient?.signed_at ?? null,
              name: recipient?.name ?? recipient?.signed_by,
            });
          },
        },
      ];

      return columnDefs;
    },
    [baseRowNumber, isStoreUser, statusFilter],
  );

  const issues = data?.list ?? [];

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((option) => (
            <Button
              key={option.key}
              variant={statusFilter === option.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(option.key)}
            >
              {option.label}
            </Button>
          ))}
        </div>
        {isSuperAdmin && statusFilter === 'ISSUED' ? (
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={isExporting}
          >
            <Download className="mr-2 h-4 w-4" />
            {isExporting ? 'Preparing…' : 'Download PDF'}
          </Button>
        ) : null}
      </div>
      {isStoreUser && statusFilter === 'SUBMITTED' ? (
        <p className="text-xs text-muted-foreground">
          Focus on completing the first request in the queue to unlock the next one.
        </p>
      ) : null}
      <CustomizableTable<DeviceMaterialIssue, unknown>
        columns={columns}
        data={issues}
        totalItems={data?.count ?? 0}
        isLoading={isLoading}
        pagination={pagination}
        onPaginationChange={setPagination}
        showColumnVisibilityToggle={false}
        options={{ manualPagination: true, pageSizeOptions: [10, 20, 50, 100] }}
        onRowClick={isStoreUser ? handleRowSelect : undefined}
        getRowClassName={isStoreUser ? resolveRowClassName : undefined}
      />
      <Dialog open={isBatchDialogOpen} onOpenChange={(open) => (open ? setBatchDialogOpen(true) : handleDialogClose())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Store issuance</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm">
              <p className="font-medium">Request {selectedIssue?.request_number ?? '—'}</p>
              <p className="text-muted-foreground">
                {selectedIssue?.device_details?.category ?? 'Device or material'}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="batch-number">Batch / lot number</Label>
              <Input
                id="batch-number"
                value={batchInput}
                onChange={(event) => setBatchInput(event.target.value)}
                placeholder="Enter batch or lot number"
                disabled={storeSignoffMutation.isPending}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleDialogClose} disabled={storeSignoffMutation.isPending}>
              Cancel
            </Button>
            <Button onClick={handleBatchSubmit} disabled={storeSignoffMutation.isPending}>
              {storeSignoffMutation.isPending ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
