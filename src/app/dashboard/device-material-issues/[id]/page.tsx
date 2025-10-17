"use client";

import { useParams } from "next/navigation";
import { DeviceIssueDetail } from "@/components/device-material-issue/DeviceIssueDetail";

export default function DeviceIssueDetailPage() {
  const params = useParams<{ id: string | string[] }>();
  const idParam = params?.id;
  const id = Array.isArray(idParam) ? idParam[0] : idParam;

  if (!id) {
    return null;
  }

  return (
    <div className="space-y-6">
      <DeviceIssueDetail id={id} />
    </div>
  );
}
