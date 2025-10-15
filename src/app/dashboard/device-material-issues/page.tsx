import { DeviceIssueTable } from '@/components/device-material-issue/DeviceIssueTable';

export default function DeviceMaterialIssuesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Device material issue requests</h1>
        <p className="text-sm text-muted-foreground">
          Track device and material issuance across production, QA, and field teams.
        </p>
      </div>
      <DeviceIssueTable />
    </div>
  );
}
