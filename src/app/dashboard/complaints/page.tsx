import Link from "next/link";
import { ComplaintsTable } from "@/components/complaient/ComplaintTable";
import { Button } from "@/components/ui/button";

export default function ComplaintsPage() {
  return (
    <div className="space-y-6 py-8">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Customer complaints</h1>
          <p className="text-sm text-muted-foreground">
            Monitor open complaint investigations and track progress toward closure.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/complaints/new">Create Complaint</Link>
        </Button>
      </div>

      <ComplaintsTable />
    </div>
  );
}
