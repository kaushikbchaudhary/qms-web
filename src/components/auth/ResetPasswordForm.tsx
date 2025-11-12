"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useResetPassword } from "@/hooks/api/useAuth";
import { cn } from "@/lib/utils";

type ResetFormValues = {
  password: string;
  confirmPassword: string;
};

const ResetPasswordForm = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";
  const [changed, setChanged] = useState(false);

  const form = useForm<ResetFormValues>({
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const { mutateAsync, isPending } = useResetPassword();

  const onSubmit = async ({ password }: ResetFormValues) => {
    await mutateAsync({ token, password });
    setChanged(true);
    setTimeout(() => router.push("/auth/login"), 2000);
  };

  const password = form.watch("password") ?? "";
  const confirmPassword = form.watch("confirmPassword") ?? "";
  const isPasswordStrong = password.length >= 6;
  const canSubmit = isPasswordStrong && password === confirmPassword;

  if (!token) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-2xl flex-col items-center justify-center px-4 text-center">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Reset link invalid</CardTitle>
            <CardDescription>The reset URL is missing or invalid. Please request a new link.</CardDescription>
          </CardHeader>
          <CardFooter className="justify-center pb-6">
            <Link href="/auth/forgot-password" className="text-primary hover:underline">
              Request new link
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/40 py-12">
      <div className="mx-auto w-full max-w-xl px-4">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold tracking-tight">Choose a new password</CardTitle>
            <CardDescription>Use a strong password that you haven’t used on QMS before.</CardDescription>
          </CardHeader>
          <CardContent>
            {changed ? (
              <div className="space-y-3 rounded-md border border-emerald-200 bg-emerald-50/60 p-4 text-sm text-emerald-900">
                <p className="font-medium">Password updated</p>
                <p>You will be redirected to the sign-in page shortly.</p>
              </div>
            ) : (
              <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)} noValidate>
                <div className="space-y-2">
                  <Label htmlFor="password">New password</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    {...form.register("password")}
                  />
                  <p className="text-xs text-muted-foreground">Minimum 6 characters.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    {...form.register("confirmPassword")}
                  />
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-xs text-destructive">Passwords do not match.</p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={!canSubmit || isPending}>
                  {isPending ? "Updating…" : "Update password"}
                </Button>
              </form>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-3 text-sm text-muted-foreground">
            <div className="w-full border-t pt-3 text-center">
              Know your password?{" "}
              <Link href="/auth/login" className={cn("text-primary hover:underline")}>
                Return to login
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default ResetPasswordForm;
