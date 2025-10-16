"use client"

import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Download, Loader2, RefreshCw } from 'lucide-react';
import {
  useDeviceMaterialIssue,
  useDeviceMaterialIssueAcknowledge,
  useDeviceMaterialIssueAttachmentDelete,
  useDeviceMaterialIssueAttachmentUpload,
  useDeviceMaterialIssuePdf,
  useDeviceMaterialIssueQueueHead,
  useDeviceMaterialIssueReopen,
  useDeviceMaterialIssueStatusTransition,
  useDeviceMaterialIssueStoreSignoff,
} from '@/hooks/api/useDeviceMaterialIssues';
import { deviceMaterialIssuesApi } from '@/lib/api/endpoints/deviceMaterialIssues';
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

type DeviceIssueDetailProps = {
  id: string;
};

export function DeviceIssueDetail({ id }: DeviceIssueDetailProps) {
  const { data, isLoading, refetch } = useDeviceMaterialIssue(id);
  const queueHeadQuery = useDeviceMaterialIssueQueueHead();

  const transitionMutation = useDeviceMaterialIssueStatusTransition(id);
  const attachmentUploadMutation = useDeviceMaterialIssueAttachmentUpload(id);
  const attachmentDeleteMutation = useDeviceMaterialIssueAttachmentDelete(id);
  const storeSignoffMutation = useDeviceMaterialIssueStoreSignoff(id);
  const acknowledgeMutation = useDeviceMaterialIssueAcknowledge(id);
  const pdfMutation = useDeviceMaterialIssuePdf(id);
  const reopenMutation = useDeviceMaterialIssueReopen(id);
  const { user } = useAuthStore();

  const [statusPayload, setStatusPayload] = useState<DeviceMaterialIssueStatusUpdatePayload>({
    newStatus: data?.status ?? 'SUBMITTED',
    notes: '',
    override: false,
  });
  const [batchNumber, setBatchNumber] = useState('');
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const userRoles = user?.role ?? [];
  const canRecordStoreSignoff =
    userRoles.includes(roles.PRODUCTION) ||
    userRoles.includes(roles.STORE_INVENTORY) ||
    userRoles.includes(roles.SUPER_ADMIN);

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

  const handleAttachmentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const formData = new FormData();
    formData.append('attachment', file);
    setIsUploadingAttachment(true);
    try {
      await attachmentUploadMutation.mutateAsync(formData);
      await refetch();
      event.target.value = '';
    } catch (error) {
      showApiErrorToast(error);
    } finally {
      setIsUploadingAttachment(false);
    }
  };

  const handleAttachmentDelete = async (path: string) => {
    try {
      await attachmentDeleteMutation.mutateAsync(path);
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

  const handleDownloadPdf = async () => {
    try {
      const blob = await pdfMutation.mutateAsync();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${request?.request_number ?? 'device-request'}.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
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

  return (
    <div className="space-y-6">
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
          <Button variant="outline" onClick={handleDownloadPdf} disabled={pdfMutation.isPending}>
            <Download className="mr-2 h-4 w-4" /> Download PDF
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
            <div><span className="font-medium">Quantity:</span> {request.device_details.quantity} {request.device_details.unit ?? ''}</div>
            <div>
              <span className="font-medium">Serial / Lot:</span>{' '}
              {request.production?.batch_number ?? request.device_details.serial_number ?? '—'}
            </div>
            <div><span className="font-medium">Expected use:</span> {request.device_details.expected_use_duration ?? '—'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Purpose</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>{request.purpose?.description ?? '—'}</div>
            <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
              <span>Project code</span>
              <span className="text-foreground">{request.purpose?.project_code ?? '—'}</span>
              <span>Client reference</span>
              <span className="text-foreground">{request.purpose?.client_reference ?? '—'}</span>
            </div>
            {request.purpose?.justification && (
              <p className="text-sm text-muted-foreground">Justification: {request.purpose.justification}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Production & approvals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div><span className="font-medium">Assigned to:</span> {request.production?.assigned_to ?? '—'}</div>
            <div><span className="font-medium">Batch number:</span> {request.production?.batch_number ?? '—'}</div>
            <div><span className="font-medium">Notes:</span> {request.production?.notes ?? '—'}</div>
            <Separator className="my-2" />
            <div><span className="font-medium">Approved by:</span> {request.approval?.approved_by ?? '—'}</div>
            <div><span className="font-medium">Approval notes:</span> {request.approval?.notes ?? '—'}</div>
          </CardContent>
        </Card>
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Pickup details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm md:grid-cols-3">
            <div>
              <p className="font-medium">Scheduled for</p>
              <p>{formatDateTime(request.pickup?.scheduled_for)}</p>
            </div>
            <div>
              <p className="font-medium">Location</p>
              <p>{request.pickup?.location ?? '—'}</p>
            </div>
            <div>
              <p className="font-medium">Issued at</p>
              <p>{formatDateTime(request.pickup?.issued_at)}</p>
            </div>
            <div>
              <p className="font-medium">Issued by</p>
              <p>{request.pickup?.issued_by ?? '—'}</p>
            </div>
            <div>
              <p className="font-medium">FIFO position</p>
              <p>{request.pickup?.fifo_position ?? '—'}</p>
            </div>
            <div>
              <p className="font-medium">Override reason</p>
              <p>{request.pickup?.override_reason ?? '—'}</p>
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
                  <p>{entry.changed_by ?? 'System'}</p>
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

      <Card>
        <CardHeader>
          <CardTitle>Update status</CardTitle>
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
            <div className="flex items-center justify-between gap-4 rounded-md border p-3">
              <div className="space-y-1">
                <Label htmlFor="override-toggle">Override FIFO / permissions</Label>
                <p className="text-xs text-muted-foreground">
                  Requires super-admin privileges.
                </p>
              </div>
              <Switch
                id="override-toggle"
                checked={Boolean(statusPayload.override)}
                onCheckedChange={(checked) =>
                  setStatusPayload((prev) => ({ ...prev, override: checked }))
                }
              />
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

      <Card>
        <CardHeader>
          <CardTitle>Attachments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Label className="font-medium">Upload new file</Label>
            <Input type="file" onChange={handleAttachmentUpload} disabled={isUploadingAttachment} className="max-w-sm" />
            {isUploadingAttachment && <span className="text-sm text-muted-foreground">Uploading…</span>}
          </div>
          <div className="grid gap-2">
            {(request.attachments ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">No attachments uploaded yet.</p>
            )}
            {(request.attachments ?? []).map((attachment) => (
              <div
                key={attachment.path}
                className="flex flex-wrap items-center justify-between rounded-md border p-3 text-sm"
              >
                <div className="flex flex-col">
                  <span className="font-medium">{attachment.filename}</span>
                  <span className="text-xs text-muted-foreground">Uploaded {formatDateTime(attachment.uploaded_at)}</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        const blob = await deviceMaterialIssuesApi.downloadAttachment(attachment.path);
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = attachment.filename;
                        link.click();
                        URL.revokeObjectURL(url);
                      } catch (error) {
                        showApiErrorToast(error);
                      }
                    }}
                  >
                    <Download className="mr-2 h-4 w-4" /> Download
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleAttachmentDelete(attachment.path)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Store issuance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm font-medium">Recorded batch / lot number</p>
              <p className="text-sm text-muted-foreground">
                {request.production?.batch_number ?? '—'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Signed by</p>
              <p className="text-sm text-muted-foreground">
                {request.pickup?.store_signed_name ?? '—'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Signed on</p>
              <p className="text-sm text-muted-foreground">
                {formatDateTime(request.pickup?.store_signed_at)}
              </p>
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
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm font-medium">Recipient</p>
              <p className="text-sm text-muted-foreground">{request.recipient?.name ?? '—'}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Signed on</p>
              <p className="text-sm text-muted-foreground">{formatDateTime(request.recipient?.signed_at)}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Signature</p>
              <p className="text-sm text-muted-foreground">
                {request.recipient?.signature_path ? 'Stored' : '—'}
              </p>
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
