import { IncomingInspectionForm } from '@/components/incoming-inspection/IncomingInspectionForm';

export default function NewIncomingInspectionPage() {
  return (
    <div className="space-y-6 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New incoming inspection</h1>
        <p className="text-sm text-muted-foreground">
          Fill the inspection form and preview it in the PDF layout.
        </p>
      </div>
      <IncomingInspectionForm />
    </div>
  );
}
