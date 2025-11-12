import { Suspense } from "react";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-muted-foreground">Loading reset form…</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
