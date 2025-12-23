import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { IncomingInspectionTable } from '@/components/incoming-inspection/IncomingInspectionTable';

export default function IncomingInspectionsPage() {
  return (
    <div className="space-y-6 py-8">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Incoming inspections</h1>
          <p className="text-sm text-muted-foreground">
            Capture incoming electronic component inspections and download the filled form.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/incoming-inspections/new">Create inspection</Link>
        </Button>
      </div>
      <IncomingInspectionTable />
    </div>
  );
}
