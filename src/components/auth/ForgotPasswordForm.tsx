"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForgotPassword } from "@/hooks/api/useAuth";

type ForgotFormValues = {
  email: string;
};

const ForgotPasswordForm = () => {
  const form = useForm<ForgotFormValues>({
    defaultValues: { email: "" },
  });
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const { mutateAsync, isPending } = useForgotPassword();

  const onSubmit = async (values: ForgotFormValues) => {
    await mutateAsync(values);
    setSubmittedEmail(values.email);
  };

  const emailValue = form.watch("email") ?? "";
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const canSubmit = emailPattern.test(emailValue.trim());

  return (
    <div className="min-h-screen bg-muted/40 py-12">
      <div className="mx-auto w-full max-w-xl px-4">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold tracking-tight">Forgot password</CardTitle>
            <CardDescription>
              Enter the email associated with your QMS account and we&apos;ll send you a secure link to reset your password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {submittedEmail ? (
              <div className="space-y-3 rounded-md border border-emerald-200 bg-emerald-50/60 p-4 text-sm text-emerald-900">
                <p className="font-medium">Check your inbox</p>
                <p>
                  We sent reset instructions to <span className="font-semibold">{submittedEmail}</span>. The link expires
                  in 1 hour.
                </p>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@company.com"
                    {...form.register("email")}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={!canSubmit || isPending}>
                  {isPending ? "Sending link…" : "Send reset link"}
                </Button>
              </form>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-3 text-sm text-muted-foreground">
            <div className="w-full border-t pt-3 text-center">
              Remembered your password?{" "}
              <Link href="/auth/login" className="text-primary hover:underline">
                Back to sign in
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPasswordForm;
