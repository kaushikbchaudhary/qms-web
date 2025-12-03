"use client";

import { useState } from "react";
import Link from "next/link";
import { ComplaintsTable } from "@/components/complaient/ComplaintTable";
import { Button } from "@/components/ui/button";
import { complaintsApi } from "@/lib/api/endpoints/complaints";
import { toast } from "sonner";

export default function ComplaintsPage() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const blob = await complaintsApi.exportComplaintsExcel();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "complaints.xlsx";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export complaints", error);
      toast.error("Failed to export complaints. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 py-8">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Customer complaints</h1>
          <p className="text-sm text-muted-foreground">
            Monitor open complaint investigations and track progress toward closure.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} disabled={isExporting}>
            {isExporting ? "Exporting..." : "Export Excel"}
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/complaints/serial-lookup">Serial lookup</Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/complaints/new">Create Complaint</Link>
          </Button>
        </div>
      </div>

      <ComplaintsTable />
    </div>
  );
}
