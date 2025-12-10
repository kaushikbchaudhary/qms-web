'use client';

import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { PermissionRecord } from '../types';

type Props = {
  permissions: PermissionRecord[];
  rolePermissions: Record<string, string[]>;
  onToggle: (role: string, permission: string, next: boolean) => void;
  onAddPermission: (key: string, description?: string) => void;
  onImport: (map: Record<string, string[]>) => void;
  onExport: () => Promise<Record<string, string[]>>;
};

export const PermissionMatrix: React.FC<Props> = ({
  permissions,
  rolePermissions,
  onToggle,
  onAddPermission,
  onImport,
  onExport,
}) => {
  const [newKey, setNewKey] = React.useState('');
  const [newDescription, setNewDescription] = React.useState('');
  const [importValue, setImportValue] = React.useState('');
  const [exported, setExported] = React.useState<Record<string, string[]> | null>(null);

  const roles = useMemo(() => Object.keys(rolePermissions), [rolePermissions]);

  const permissionHelp = useMemo<Record<string, string>>(
    () => ({
      'complaint.view': 'Allows viewing complaint records and dashboard lists.',
      'complaint.edit.received_info': 'Allows entering received_info and moving complaint to Under Investigation.',
      'complaint.edit.investigation': 'Allows editing investigation section and related CAPA links.',
      'complaint.edit.customer_communication': 'Allows updating customer communication and related risk info.',
      'complaint.edit.risk_management': 'Allows editing risk management section.',
      'complaint.edit.closure': 'Allows completing closure approvals.',
      'complaint.transition.submitted': 'Allows setting status to SUBMITTED (initial entry).',
      'complaint.transition.under_investigation': 'Allows moving to UNDER_INVESTIGATION.',
      'complaint.transition.resolved': 'Allows moving to RESOLVED (requires investigator acknowledgements).',
      'complaint.transition.rejected': 'Allows moving to REJECTED.',
      'complaint.transition.closed': 'Allows moving to CLOSED.',
      'complaint.assign.investigators': 'Allows assigning investigation officers.',
      'complaint.delete': 'Allows soft-deleting complaints.',
      'complaint.export': 'Allows exporting complaints (Excel/PDF).',
      'complaint.stats.view': 'Allows viewing complaint stats/serial stats.',
      'device_issue.create': 'Allows creating/listing device/material requests.',
      'device_issue.edit.requester_snapshot': 'Allows editing requester snapshot fields.',
      'device_issue.edit.device_details': 'Allows editing device details.',
      'device_issue.edit.purpose': 'Allows editing request purpose.',
      'device_issue.edit.priority': 'Allows editing priority.',
      'device_issue.edit.production': 'Allows editing production section (store/production teams).',
      'device_issue.edit.pickup': 'Allows editing pickup/store issuance info.',
      'device_issue.edit.custom_fields': 'Allows editing custom fields on request.',
      'device_issue.transition.draft': 'Allows keeping/setting request in DRAFT.',
      'device_issue.transition.submitted': 'Allows submitting requests.',
      'device_issue.transition.under_review': 'Allows moving to UNDER_REVIEW.',
      'device_issue.transition.approved': 'Allows moving to APPROVED.',
      'device_issue.transition.in_production': 'Allows moving to IN_PRODUCTION.',
      'device_issue.transition.ready_for_pickup': 'Allows moving to READY_FOR_PICKUP.',
      'device_issue.transition.issued': 'Allows moving to ISSUED (requires recipient signature).',
      'device_issue.transition.closed': 'Allows moving to CLOSED.',
      'device_issue.transition.rejected': 'Allows moving to REJECTED.',
      'device_issue.manage.drafts_any': 'Allows editing/deleting any draft/submitted request (bypasses requester-only rule).',
      'device_issue.delete.own_submitted': 'Allows deleting own draft/submitted request.',
      'device_issue.prepare_pickup': 'Allows recording batch/pickup sign-off in store/engineering flow.',
      'device_issue.export.pdf': 'Allows exporting device/material requests to PDF.',
      'site_config.view_private': 'Allows viewing private site configuration.',
      'site_config.update': 'Allows updating site configuration and permission matrix.',
      'user.signature.upload.self': 'Allows uploading own signature.',
      'user.signature.upload.others': 'Allows uploading signature for other users.',
      'user.password.update.self': 'Allows changing own password.',
    }),
    [],
  );

  const handleToggle = (role: string, key: string) => {
    const current = rolePermissions[role] ?? [];
    const next = !current.includes(key);
    onToggle(role, key, next);
  };

  const handleAdd = () => {
    if (!newKey.trim()) return;
    onAddPermission(newKey.trim(), newDescription.trim() || undefined);
    setNewKey('');
    setNewDescription('');
  };

  const handleImport = () => {
    try {
      const parsed = JSON.parse(importValue);
      onImport(parsed);
    } catch (error) {
      alert('Invalid JSON');
    }
  };

  const handleExport = async () => {
    const data = await onExport();
    setExported(data);
    setImportValue(JSON.stringify(data, null, 2));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-lg border bg-card p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <div className="flex-1 space-y-2">
            <Label>New permission key</Label>
            <Input
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              placeholder="complaint.edit.investigation"
            />
          </div>
          <div className="flex-1 space-y-2">
            <Label>Description</Label>
            <Input
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Explain what this permission does"
            />
          </div>
          <Button onClick={handleAdd}>Add permission</Button>
        </div>
        <div className="flex flex-col gap-2">
          <Label>Import / Export role-permission map (JSON)</Label>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={handleImport}>
              Import
            </Button>
          </div>
          <textarea
            className="min-h-[160px] w-full rounded-md border bg-muted/30 p-3 text-sm font-mono"
            value={importValue}
            onChange={(e) => setImportValue(e.target.value)}
            placeholder='{"super-admin":["permission.key"]}'
          />
          {exported ? (
            <div className="text-xs text-muted-foreground">
              Exported {Object.keys(exported).length} roles
            </div>
          ) : null}
        </div>
      </div>
      <TooltipProvider delayDuration={150}>
        <div className="overflow-auto rounded-lg border">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="border-b px-4 py-3 text-left font-medium">Permission</th>
                {roles.map((role) => (
                  <th key={role} className="border-b px-3 py-3 text-center font-medium">
                    {role}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {permissions.map((permission) => {
                const tooltipText =
                  permission.description ||
                  permissionHelp[permission.key] ||
                  'Toggle access for this feature.';
                return (
                  <tr key={permission.key} className="hover:bg-muted/30">
                    <td className="border-b px-4 py-2">
                      <div className="font-medium">{permission.key}</div>
                      <div className="text-xs text-muted-foreground">
                        {permission.description || permissionHelp[permission.key] || ''}
                      </div>
                    </td>
                    {roles.map((role) => {
                      const current = rolePermissions[role] ?? [];
                      const checked = current.includes(permission.key);
                      return (
                        <td key={`${role}-${permission.key}`} className="border-b px-3 py-2 text-center">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <input
                                type="checkbox"
                                className="h-4 w-4 accent-primary"
                                checked={checked}
                                onChange={() => handleToggle(role, permission.key)}
                                aria-label={`Toggle ${permission.key} for ${role}`}
                              />
                            </TooltipTrigger>
                            <TooltipContent side="top" align="center" className="max-w-xs text-left">
                              <p className="text-xs font-semibold">{permission.key}</p>
                              <p className="text-xs text-muted-foreground">{tooltipText}</p>
                            </TooltipContent>
                          </Tooltip>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </TooltipProvider>
    </div>
  );
};
