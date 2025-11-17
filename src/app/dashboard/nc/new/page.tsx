import { NcForm } from '@/components/forms/nc-form';

export default function NewNcPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Create NC Report</h1>
        <p className="text-sm text-muted-foreground">
          Capture the report metadata so the official Non-Conformance Report PDF can be generated instantly.
        </p>
      </div>
      <NcForm />
    </div>
  );
}
