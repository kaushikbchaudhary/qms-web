"use client"

import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle2, Circle, Clock3, Loader2, RefreshCw } from 'lucide-react';
import {
  useDeviceMaterialIssue,
  useDeviceMaterialIssueAcknowledge,
  useDeviceMaterialIssueQueueHead,
  useDeviceMaterialIssueReopen,
  useDeviceMaterialIssueStatusTransition,
  useDeviceMaterialIssueStoreSignoff,
} from '@/hooks/api/useDeviceMaterialIssues';
import {
  DeviceMaterialIssue,
  DeviceMaterialIssueStatus,
  DeviceMaterialIssueStatusUpdatePayload,
} from '@/lib/api/types/deviceMaterialIssue';
import { showApiErrorToast } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { roles } from '@/config/roles';

const STATUS_SEQUENCE: DeviceMaterialIssueStatus[] = [
  'DRAFT',
  'SUBMITTED',
  'UNDER_REVIEW',
  'APPROVED',
  'IN_PRODUCTION',
  'READY_FOR_PICKUP',
  'ISSUED',
  'CLOSED',
  'REJECTED',
];

const formatDateTime = (value?: string) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return format(date, 'dd MMM yyyy, HH:mm');
};

const formatStatus = (status: string) => status.replace(/_/g, ' ');

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

const formatPersonName = (person: any): string => {
  if (!person) return '—';
  if (typeof person === 'string') {
    const trimmed = person.trim();
    return trimmed.length ? trimmed : '—';
  }
  if (typeof person === 'object') {
    const candidateName = [person?.firstName, person?.middleName, person?.lastName]
      .filter((value) => typeof value === 'string' && value.trim().length > 0)
      .join(' ')
      .trim();
    if (candidateName) {
      return candidateName;
    }
    if (typeof person?.name === 'string' && person.name.trim().length > 0) {
      return person.name.trim();
    }
    if (typeof person?.emailId === 'string' && person.emailId.trim().length > 0) {
      return person.emailId.trim();
    }
    if (typeof person?._id === 'string') {
      return person._id;
    }
    if (typeof person?.id === 'string') {
      return person.id;
    }
  }
  return '—';
};

type DeviceIssueDetailProps = {
  id: string;
};

const STORE_ROLE_ALIASES = [roles.STORE_INVENTORY, 'store & inventory'];
const STATUS_MANAGER_ROLES = [
  roles.SUPER_ADMIN,
  // roles.SUPPORT,
  // roles.QA,
  // roles.QUALITY_ANALYST_SOFTWARE,
  // roles.QA_HARDWARE,
  // roles.PRODUCTION,
  // roles.ENGINEERING_MAINTENANCE,
  // roles.HARDWARE_FIRMWARE_ENGINEER,
];

export function DeviceIssueDetail({ id }: DeviceIssueDetailProps) {
  const { data, isLoading, refetch } = useDeviceMaterialIssue(id);
  const queueHeadQuery = useDeviceMaterialIssueQueueHead();

  const transitionMutation = useDeviceMaterialIssueStatusTransition(id);
  const storeSignoffMutation = useDeviceMaterialIssueStoreSignoff(id);
  const acknowledgeMutation = useDeviceMaterialIssueAcknowledge(id);
  const reopenMutation = useDeviceMaterialIssueReopen(id);
  const { user } = useAuthStore();

  const [statusPayload, setStatusPayload] = useState<DeviceMaterialIssueStatusUpdatePayload>({
    newStatus: data?.status ?? 'SUBMITTED',
    notes: '',
  });
  const [batchNumber, setBatchNumber] = useState('');
  const userRoles = user?.role ?? [];
  const isStoreUser = userRoles.some((roleKey) => STORE_ROLE_ALIASES.includes(roleKey));
  const canRecordStoreSignoff = isStoreUser;
  const canUpdateStatus = false;

  useEffect(() => {
    if (data?.production?.batch_number) {
      setBatchNumber(data.production.batch_number);
    } else {
      setBatchNumber('');
    }
  }, [data?.production?.batch_number]);

  const request = data as DeviceMaterialIssue | undefined;
  const currentStatus = request?.status;

  useEffect(() => {
    if (currentStatus) {
      setStatusPayload((prev) => ({ ...prev, newStatus: currentStatus }));
    }
  }, [currentStatus]);

  useEffect(() => {
    if (request?.production?.batch_number) {
      setBatchNumber(request.production.batch_number);
    } else {
      setBatchNumber('');
    }
  }, [request?.production?.batch_number]);

  const isQueueHead = request && queueHeadQuery.data && queueHeadQuery.data?.request_number === request.request_number;

  const handleStatusChange = async () => {
    try {
      await transitionMutation.mutateAsync(statusPayload);
      await refetch();
    } catch (error) {
      showApiErrorToast(error);
    }
  };

  const handleStoreSignoff = async () => {
    const trimmedBatch = batchNumber.trim();
    if (!trimmedBatch) {
      showApiErrorToast(new Error('Batch or lot number is required.'));
      return;
    }

    try {
      await storeSignoffMutation.mutateAsync({ batch_number: trimmedBatch });
      await refetch();
    } catch (error) {
      showApiErrorToast(error);
    }
  };

  const handleAcknowledge = async () => {
    try {
      await acknowledgeMutation.mutateAsync({});
      await refetch();
    } catch (error) {
      showApiErrorToast(error);
    }
  };

  const handleReopen = async () => {
    try {
      await reopenMutation.mutateAsync();
      await refetch();
    } catch (error) {
      showApiErrorToast(error);
    }
  };

  const statusOptions = useMemo(
    () =>
      STATUS_SEQUENCE.map((status) => ({
        value: status,
        label: formatStatus(status),
      })),
    [],
  );

  if (isLoading || !request) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading request…
      </div>
    );
  }

  const lastStatusChange = request.status_history?.[request.status_history.length - 1];
  const requestedOn = request.progress_metadata?.requested_on ?? request.created_at;
  const storeSignoffComplete = Boolean(
    request.production?.batch_number &&
    request.pickup?.store_signed_at &&
    request.pickup?.store_signature_path,
  );
  const storeSignoffInProgress = !storeSignoffComplete && isStoreUser;
  const recipientAcknowledged = Boolean(request.recipient?.signed_at);
  const awaitingRecipient = !recipientAcknowledged;

  const workflowSteps = [
    {
      id: 'submitted',
      label: 'Request submitted',
      status: 'done' as const,
      meta: `${formatDateTime(requestedOn)} · ${formatPersonName(request.requester_snapshot?.name ?? request.requested_by)}`,
    },
    {
      id: 'store',
      label: 'Store sign-off',
      status: storeSignoffComplete ? 'done' : storeSignoffInProgress ? 'in-progress' : 'pending',
      meta: storeSignoffComplete
        ? `Batch ${request.production?.batch_number ?? '—'} recorded by ${formatPersonName((request.pickup as any)?.store_signed_name)} on ${formatDateTime(request.pickup?.store_signed_at)}`
        : 'Waiting for Store & Inventory to record batch / lot number.',
    },
    {
      id: 'pickup',
      label: 'Pickup acknowledgement',
      status: recipientAcknowledged ? 'done' : storeSignoffComplete ? 'in-progress' : 'pending',
      meta: recipientAcknowledged
        ? `Acknowledged by ${formatPersonName(request.recipient?.name)} on ${formatDateTime(request.recipient?.signed_at)}`
        : 'Recipient confirmation pending.',
    },
  ];

  if (isStoreUser) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Request {request.request_number}</CardTitle>
            <CardDescription className="flex items-center gap-2">
              <Badge variant="secondary">{formatStatus(request.status)}</Badge>
              <Badge>{request.priority}</Badge>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Provide the batch or lot number to issue this request. Saving will record your stored signature and move the request to the next stage.
            </p>
            <div className="space-y-2">
              <Label htmlFor="store-batch-number">Batch / lot number</Label>
              <Input
                id="store-batch-number"
                value={batchNumber}
                onChange={(event) => setBatchNumber(event.target.value)}
                placeholder="Enter batch or lot number"
                disabled={storeSignoffMutation.isPending}
              />
            </div>
            <Button
              onClick={handleStoreSignoff}
              disabled={storeSignoffMutation.isPending || batchNumber.trim().length === 0}
            >
              {storeSignoffMutation.isPending ? 'Saving…' : 'Save store sign-off'}
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Quick summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <span className="font-medium">Device / material:</span>{' '}
              {request.device_details?.category ?? '—'}
            </div>
            <div>
              <span className="font-medium">Model:</span>{' '}
              {request.device_details?.model ?? '—'}
            </div>
            <div>
              <span className="font-medium">Quantity:</span>{' '}
              {request.device_details?.quantity ?? '—'}
            </div>
            <div>
              <span className="font-medium">Purpose:</span>{' '}
              {request.purpose?.description ?? '—'}
            </div>
            <div>
              <span className="font-medium">Requested by:</span>{' '}
              {request.requester_snapshot?.name ?? '—'}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isStoreUser && !request.production?.batch_number && (
        <Alert>
          <AlertDescription>
            This request needs a batch or lot number before it can be issued. Add the number below to record the store sign-off.
          </AlertDescription>
        </Alert>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Workflow status</CardTitle>
          <CardDescription>Track the request as it progresses from submission to pickup.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {workflowSteps.map((step) => {
            const icon = step.status === 'done' ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : step.status === 'in-progress' ? (
              <Clock3 className="h-5 w-5 text-amber-500" />
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground" />
            );

            return (
              <div key={step.id} className="flex items-start gap-3">
                <div className="mt-1">{icon}</div>
                <div>
                  <p className="text-sm font-medium text-foreground">{step.label}</p>
                  <p className="text-xs text-muted-foreground">{step.meta}</p>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Request {request.request_number}</h1>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="secondary">{formatStatus(request.status)}</Badge>
            <Badge>{request.priority}</Badge>
            {isQueueHead && (
              <Badge variant="outline">FIFO position ✓</Badge>
            )}
          </div>
          {lastStatusChange && (
            <p className="mt-2 text-sm text-muted-foreground">
              Last update {formatDateTime(lastStatusChange.changed_at)}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
          {request.status === 'REJECTED' || request.status === 'CLOSED' ? (
            <Button onClick={handleReopen} disabled={reopenMutation.isPending}>
              Reopen
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Requester details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div><span className="font-medium">Name:</span> {request.requester_snapshot?.name ?? '—'}</div>
            <div><span className="font-medium">Department:</span> {request.requester_snapshot?.department ?? '—'}</div>
            <div><span className="font-medium">Contact:</span> {request.requester_snapshot?.contact_number ?? '—'}</div>
            <div><span className="font-medium">Email:</span> {request.requester_snapshot?.email ?? '—'}</div>
            <div><span className="font-medium">Employee ID:</span> {request.requester_snapshot?.employee_id ?? '—'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Device details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div><span className="font-medium">Category:</span> {request.device_details.category}</div>
            <div><span className="font-medium">Model:</span> {request.device_details.model ?? '—'}</div>
            <div><span className="font-medium">Quantity:</span> {request.device_details.quantity}</div>
            <div>
              <span className="font-medium">Serial / Lot:</span>{' '}
              {request.production?.batch_number ?? '—'}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Status history</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(request.status_history ?? []).map((entry, index) => (
              <div key={`${entry.status}-${index}`} className="flex items-start justify-between gap-4 rounded-lg border p-3 text-sm">
                <div>
                  <p className="font-medium">{formatStatus(entry.status)}</p>
                  <p className="text-muted-foreground">
                    {formatDateTime(entry.changed_at)}
                  </p>
                  {entry.notes && <p className="mt-1 text-muted-foreground">{entry.notes}</p>}
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <p>{formatPersonName(entry.changed_by) ?? 'System'}</p>
                  {entry.override && <Badge variant="outline">Override</Badge>}
                </div>
              </div>
            ))}
            {(request.status_history ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">No status changes recorded yet.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {canUpdateStatus && (
        <Card>
          <CardHeader>
            <CardTitle>Update status</CardTitle>
            <CardDescription>Use carefully—each transition triggers notifications and audit history.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="status-select">New status</Label>
                <select
                  id="status-select"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={statusPayload.newStatus}
                  onChange={(event) =>
                    setStatusPayload((prev) => ({ ...prev, newStatus: event.target.value as DeviceMaterialIssueStatus }))
                  }
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status-notes">Notes</Label>
              <Textarea
                id="status-notes"
                value={statusPayload.notes ?? ''}
                onChange={(event) => setStatusPayload((prev) => ({ ...prev, notes: event.target.value }))}
                placeholder="Add context for the status change"
                rows={3}
              />
            </div>
            <Button onClick={handleStatusChange} disabled={transitionMutation.isPending}>
              {transitionMutation.isPending ? 'Updating…' : 'Update status'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Attachments intentionally omitted: inventory module tracks metadata only. */}

      <Card>
        <CardHeader>
          <CardTitle>Store sign-off</CardTitle>
          <CardDescription>
            {storeSignoffComplete
              ? 'Batch number recorded. Contact the store team if a correction is required.'
              : isStoreUser
                ? 'Store & Inventory must record the batch or lot number before the device can be issued.'
                : 'Awaiting Store & Inventory to record the batch or lot number.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <p className="text-sm font-medium">Recorded batch / lot number</p>
              <p className="text-sm text-muted-foreground">
                {request.production?.batch_number ?? '—'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Signed by</p>
              <p className="text-sm text-muted-foreground">
                {formatPersonName((request.pickup as any)?.store_signed_name)}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Signed on</p>
              <p className="text-sm text-muted-foreground">
                {formatDateTime(request.pickup?.store_signed_at)}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Signature</p>
              {request.pickup?.store_signature_path ? (
                <img
                  src={resolveSignatureUrl(request.pickup.store_signature_path)}
                  alt="Store sign-off signature"
                  className="mt-1 h-16 w-auto max-w-[200px] rounded border bg-white object-contain"
                />
              ) : (
                <p className="text-sm text-muted-foreground">—</p>
              )}
            </div>
          </div>
          {canRecordStoreSignoff && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="batch-number-input">Update batch / lot number</Label>
                <Input
                  id="batch-number-input"
                  value={batchNumber}
                  onChange={(event) => setBatchNumber(event.target.value)}
                  placeholder="Enter batch or lot number"
                  disabled={storeSignoffMutation.isPending}
                />
              </div>
              <Button
                onClick={handleStoreSignoff}
                disabled={storeSignoffMutation.isPending || batchNumber.trim().length === 0}
              >
                {storeSignoffMutation.isPending ? 'Saving…' : 'Save store sign-off'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recipient acknowledgement</CardTitle>
          <CardDescription>
            {recipientAcknowledged
              ? 'Pickup has been confirmed. Capture a new acknowledgement only if you need to override the previous record.'
              : 'Once the device is handed over, capture the recipient name and signature to complete the workflow.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm font-medium">Recipient</p>
              <p className="text-sm text-muted-foreground">{formatPersonName(request.recipient?.name)}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Signed on</p>
              <p className="text-sm text-muted-foreground">{formatDateTime(request.recipient?.signed_at)}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Signature</p>
              {request.recipient?.signature_path ? (
                <img
                  src={resolveSignatureUrl(request.recipient.signature_path)}
                  alt="Recipient signature"
                  className="mt-1 h-16 w-auto max-w-[200px] rounded border bg-white object-contain"
                />
              ) : (
                <p className="text-sm text-muted-foreground">—</p>
              )}
            </div>
          </div>
          <Button
            onClick={handleAcknowledge}
            disabled={acknowledgeMutation.isPending || Boolean(request.recipient?.signed_at)}
          >
            {request.recipient?.signed_at
              ? 'Pickup confirmed'
              : acknowledgeMutation.isPending
                ? 'Saving…'
                : 'Confirm pickup'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
