"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BackButtonProps = {
  fallbackHref?: string;
  label?: string;
  className?: string;
};

/**
 * Reusable back button that prefers history.back() and falls back to a provided URL.
 */
export function BackButton({
  fallbackHref = "/dashboard/complaints",
  label = "Back",
  className,
}: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push(fallbackHref);
  };

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={handleBack}
      className={cn("w-fit px-0 gap-2 text-sm", className)}
    >
      <ArrowLeft className="h-4 w-4" />
      <span>{label}</span>
    </Button>
  );
}
