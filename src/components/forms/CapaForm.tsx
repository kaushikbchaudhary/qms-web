"use client"

import { useMemo, useState } from "react";
import { Resolver, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon, CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { capaFormSchema, CapaFormValues } from "@/lib/validations/capa";
import { useCreateCapa } from "@/hooks/api/useCapa";
import { CreateCapaPayload, CreateCapaResponse } from "@/lib/api/types/capa";

export function CapaForm() {
  const [result, setResult] = useState<CreateCapaResponse | null>(null);
  const createCapaMutation = useCreateCapa();

  const form = useForm<CapaFormValues>({
    resolver: zodResolver(capaFormSchema) as Resolver<CapaFormValues>,
    defaultValues: {
      capaInitiationDate: new Date(),
      isRepeated: false,
      proceedToCapa: true,
      createdBy: {
        name: "",
        designation: "",
      },
    },
  });

  const submissionInFlight = createCapaMutation.isPending || form.formState.isSubmitting;

  const apiBaseUrl = useMemo(() => process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, '') ?? '', []);

  const handleSubmit = async (values: CapaFormValues) => {
    const payload: CreateCapaPayload = {
      capaInitiationDate: values.capaInitiationDate.toISOString(),
      sourceOfNonConformance: values.sourceOfNonConformance,
      description: values.description,
      isRepeated: values.isRepeated,
      proceedToCapa: values.proceedToCapa,
      rootCauseAnalysis: values.rootCauseAnalysis,
      remarks: values.remarks,
      correction: values.correction,
      correctiveAction: values.correctiveAction,
      preventiveAction: values.preventiveAction,
      createdBy: {
        name: values.createdBy.name,
        designation: values.createdBy.designation,
      },
    };

    try {
      const response = await createCapaMutation.mutateAsync(payload);
      setResult(response);
      form.reset({
        capaInitiationDate: new Date(),
        sourceOfNonConformance: undefined,
        description: undefined,
        isRepeated: false,
        proceedToCapa: true,
        rootCauseAnalysis: undefined,
        remarks: undefined,
        correction: undefined,
        correctiveAction: undefined,
        preventiveAction: undefined,
        createdBy: {
          name: values.createdBy.name,
          designation: values.createdBy.designation,
        },
      });
    } catch (error) {
      // errors handled via toast
      console.error('Failed to create CAPA record', error);
    }
  };

  const handleCopyCapaId = async () => {
    if (!result?.capaId || typeof navigator === 'undefined' || !navigator?.clipboard) {
      return;
    }
    try {
      await navigator.clipboard.writeText(result.capaId);
    } catch (error) {
      console.error('Failed to copy CAPA ID', error);
    }
  };

  const resolvedDownloadUrl = result?.fileUrl
    ? `${apiBaseUrl ? `${apiBaseUrl}/` : ''}${result.fileUrl.replace(/^\/+/, '')}`
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Corrective / Preventive Action (CAPA)</h2>
        <p className="text-sm text-muted-foreground">
          Fill out this form to generate a CAPA PDF (FOR/QAD/026/01). Only the top section is prefilled; the remaining
          signature blocks stay empty for handwritten approvals.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="capaInitiationDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>CAPA Initiation Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className="flex w-full justify-start gap-2 truncate"
                      >
                        {field.value ? format(field.value, "PPP") : "Select a date"}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                      disabled={(date) => date > new Date()}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="sourceOfNonConformance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Source of Non-Conformance</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      placeholder="Enter the triggering source or reference"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="rootCauseAnalysis"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Root Cause Analysis</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      placeholder="Summarize the root cause analysis"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                    <Textarea
                      {...field}
                      value={field.value ?? ""}
                      placeholder="Provide a concise description of the non-conformance or event."
                      className="min-h-[120px]"
                    />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="remarks"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Remarks</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value ?? ""}
                      placeholder="Optional remarks or follow-ups"
                      className="min-h-[80px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="correction"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Correction</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value ?? ""}
                      placeholder="Immediate containment or correction actions"
                      className="min-h-[80px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="correctiveAction"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Corrective Action</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value ?? ""}
                      placeholder="Describe long-term corrective measures"
                      className="min-h-[80px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="preventiveAction"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preventive Action</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value ?? ""}
                      placeholder="Outline preventive measures to avoid recurrence"
                      className="min-h-[80px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="isRepeated"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-md border p-4">
                  <div>
                    <FormLabel>Is Non-Conformity Repeated?</FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Toggle on if the issue has been observed previously.
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="proceedToCapa"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-md border p-4">
                  <div>
                    <FormLabel>Proceed to CAPA?</FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Keep enabled when CAPA escalation is required.
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="createdBy.name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prepared By (Name)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      placeholder="Full name of preparer"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="createdBy.designation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prepared By (Designation)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      placeholder="Designation or role"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button type="submit" disabled={submissionInFlight} className="w-full md:w-auto">
            {submissionInFlight ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating PDF...
              </>
            ) : (
              "Generate CAPA PDF"
            )}
          </Button>
        </form>
      </Form>

      {result && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="text-green-600" />
          <AlertTitle>CAPA Generated</AlertTitle>
          <AlertDescription className="space-y-3">
            <p className="font-medium">CAPA ID: <span className="font-mono">{result.capaId}</span></p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={handleCopyCapaId}>
                Copy CAPA ID
              </Button>
              {resolvedDownloadUrl && (
                <Button asChild variant="secondary" size="sm">
                  <Link href={resolvedDownloadUrl} target="_blank" rel="noopener noreferrer">
                    View PDF
                  </Link>
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Store the CAPA ID in the associated complaint or NC record. The PDF is saved under <code className="font-mono">/uploads/capa</code>.
            </p>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
