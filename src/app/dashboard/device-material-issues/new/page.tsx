import { DeviceMaterialIssueForm } from '@/components/forms/device-material-issue-form';

export default function NewDeviceMaterialIssuePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New device/material issue request</h1>
        <p className="text-sm text-muted-foreground">
          Provide context for the device or material requirement so production and QA can fulfil it efficiently.
        </p>
      </div>
      <DeviceMaterialIssueForm />
    </div>
  );
}
