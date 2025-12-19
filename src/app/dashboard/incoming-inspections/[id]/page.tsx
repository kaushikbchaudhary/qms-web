"use client";

import { useParams } from 'next/navigation';
import { IncomingInspectionForm } from '@/components/incoming-inspection/IncomingInspectionForm';
import { useIncomingInspection } from '@/hooks/api/useIncomingInspections';
import { Button } from '@/components/ui/button';
import { incomingInspectionsApi } from '@/lib/api/endpoints/incomingInspections';
import { showApiErrorToast } from '@/lib/utils';

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export default function IncomingInspectionDetailPage() {
  const params = useParams();
  const inspectionId = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : '';
  const { data, isLoading } = useIncomingInspection(inspectionId);

  const handleDownload = async () => {
    if (!inspectionId) return;
    try {
      const blob = await incomingInspectionsApi.downloadPdf(inspectionId);
      downloadBlob(blob, `incoming-inspection-${inspectionId}.pdf`);
    } catch (error) {
      showApiErrorToast(error);
    }
  };

  if (isLoading) {
    return <div className="py-8 text-sm text-muted-foreground">Loading inspection...</div>;
  }

  if (!data) {
    return <div className="py-8 text-sm text-muted-foreground">Inspection not found.</div>;
  }

  return (
    <div className="space-y-6 py-8">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Incoming inspection</h1>
          <p className="text-sm text-muted-foreground">Review or update the inspection before download.</p>
        </div>
        <Button onClick={handleDownload}>Download PDF</Button>
      </div>
      <IncomingInspectionForm mode="edit" inspectionId={inspectionId} initialValues={data} />
    </div>
  );
}
