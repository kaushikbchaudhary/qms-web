import Link from 'next/link';
import { DeviceIssueTable } from '@/components/device-material-issue/DeviceIssueTable';
import { Button } from '@/components/ui/button';

export default function DeviceMaterialIssuesPage() {
  return (
    <div className="space-y-6 py-8">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Device/Material issue requests</h1>
          <p className="text-sm text-muted-foreground">
            Track device and material issuance across production, QA, and field teams.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/device-material-issues/new">Create Device Request</Link>
        </Button>
      </div>
      <DeviceIssueTable />
    </div>
  );
}
