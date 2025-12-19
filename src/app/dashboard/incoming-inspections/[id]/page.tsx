"use client";

import { useParams } from 'next/navigation';
import { IncomingInspectionForm, IncomingInspectionFormInputs } from '@/components/incoming-inspection/IncomingInspectionForm';
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

  const initialValues: Partial<IncomingInspectionFormInputs> = {
    component_type: data.component_type as any,
    details: {
      material_name: data.details?.material_name ?? '',
      batch_lot_no: data.details?.batch_lot_no ?? '',
      inward_date: data.details?.inward_date ?? '',
      inward_quantity: data.details?.inward_quantity ?? undefined,
      mpn_no: data.details?.mpn_no ?? '',
      material_master_id: data.details?.material_master_id ?? '',
      material_category: data.details?.material_category ?? '',
    },
    sampling: {
      total_sample_tested: data.sampling?.total_sample_tested ?? undefined,
      sample_number: data.sampling?.sample_number ?? '',
    },
    inspection_checklist: (data.inspection_checklist ?? []).map((row) => ({
      sr_no: row.sr_no,
      test_name: row.test_name ?? '',
      specification: row.specification ?? '',
      observation: row.observation ?? '',
      result: (row.result as 'PASS' | 'FAIL' | undefined) ?? 'PASS',
    })),
    release_decision: {
      overall_result: (data.release_decision?.overall_result as 'PASS' | 'FAIL' | undefined) ?? 'PASS',
      released: data.release_decision?.released ?? false,
    },
    tested_by: {
      user: (data as any).tested_by?.user ?? '',
      name: (data as any).tested_by?.name ?? '',
      signed_at: (data as any).tested_by?.signed_at ?? '',
      signature_path: (data as any).tested_by?.signature_path ?? '',
    },
    approved_by: {
      user: (data as any).approved_by?.user ?? '',
      name: (data as any).approved_by?.name ?? '',
      signed_at: (data as any).approved_by?.signed_at ?? '',
      signature_path: (data as any).approved_by?.signature_path ?? '',
    },
  };

  return (
    <div className="space-y-6 py-8">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Incoming inspection</h1>
          <p className="text-sm text-muted-foreground">Review or update the inspection before download.</p>
        </div>
        <Button onClick={handleDownload}>Download PDF</Button>
      </div>
      <IncomingInspectionForm mode="edit" inspectionId={inspectionId} initialValues={initialValues} />
    </div>
  );
}
