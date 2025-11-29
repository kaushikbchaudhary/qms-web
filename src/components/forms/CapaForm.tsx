"use client"

import { useCallback, useMemo, useState } from "react";
import { Resolver, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon, CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { capaCategoryValues, capaFormSchema, CapaFormValues } from "@/lib/validations/capa";
import { useCreateCapa } from "@/hooks/api/useCapa";
import { CreateCapaPayload, CreateCapaResponse } from "@/lib/api/types/capa";
import { GrammarInput } from "@/components/shared/GrammarInput";

const CAPA_CATEGORY_OPTIONS = capaCategoryValues.map((value) => ({
  value,
  label: value.charAt(0).toUpperCase() + value.slice(1),
}));

export function CapaForm() {
  const [result, setResult] = useState<CreateCapaResponse | null>(null);
  const createCapaMutation = useCreateCapa();

  const form = useForm<CapaFormValues>({
    resolver: zodResolver(capaFormSchema) as Resolver<CapaFormValues>,
    defaultValues: {
      capaInitiationDate: new Date(),
      capaActionCompletionDate: undefined,
      sourceOfCapa: undefined,
      complaintReference: undefined,
      description: undefined,
      capaCategory: undefined,
      impactsSafetyOrCompliance: undefined,
      isRepeated: undefined,
      proceedToCapa: true,
      rootCauseAnalysis: undefined,
      correction: undefined,
      correctiveAction: undefined,
      preventiveAction: undefined,
      extensionJustification: undefined,
      effectivenessPlan: undefined,
      effectivenessReviewDueDate: undefined,
      isCapaClosed: false,
      capaClosureDate: undefined,
    },
  });

  const submissionInFlight = createCapaMutation.isPending || form.formState.isSubmitting;

  const apiBaseUrl = useMemo(() => process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, '') ?? '', []);
  const hasInlinePdf = Boolean(result?.fileBase64);

  const handleDownloadPdf = useCallback(() => {
    if (typeof window === 'undefined' || !result?.fileBase64) {
      return;
    }
    try {
      const byteCharacters = atob(result.fileBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = result.filename ?? 'capa.pdf';
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download CAPA PDF', error);
    }
  }, [result]);

  const handleSubmit = async (values: CapaFormValues) => {
    const payload: CreateCapaPayload = {
      capaInitiationDate: values.capaInitiationDate.toISOString(),
      capaActionCompletionDate: values.capaActionCompletionDate?.toISOString(),
      sourceOfCapa: values.sourceOfCapa,
      complaintReference: values.complaintReference,
      description: values.description,
      capaCategory: values.capaCategory,
      impactsSafetyOrCompliance: values.impactsSafetyOrCompliance,
      isRepeated: values.isRepeated,
      proceedToCapa: values.proceedToCapa,
      rootCauseAnalysis: values.rootCauseAnalysis,
      correction: values.correction,
      correctiveAction: values.correctiveAction,
      preventiveAction: values.preventiveAction,
      extensionJustification: values.extensionJustification,
      effectivenessPlan: values.effectivenessPlan,
      effectivenessReviewDueDate: values.effectivenessReviewDueDate?.toISOString(),
      isCapaClosed: values.isCapaClosed,
      capaClosureDate: values.capaClosureDate?.toISOString(),
    };

    try {
      const response = await createCapaMutation.mutateAsync(payload);
      setResult(response);
      form.reset({
        capaInitiationDate: new Date(),
        capaActionCompletionDate: undefined,
        sourceOfCapa: undefined,
        complaintReference: undefined,
        description: undefined,
        capaCategory: undefined,
        impactsSafetyOrCompliance: undefined,
        isRepeated: undefined,
        proceedToCapa: true,
        rootCauseAnalysis: undefined,
        correction: undefined,
        correctiveAction: undefined,
        preventiveAction: undefined,
        extensionJustification: undefined,
        effectivenessPlan: undefined,
        effectivenessReviewDueDate: undefined,
        isCapaClosed: false,
        capaClosureDate: undefined,
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
          <div className="grid gap-6 md:grid-cols-2">
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

            <FormField
              control={form.control}
              name="capaActionCompletionDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>CAPA Action Completion Date</FormLabel>
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
                        onSelect={(date) => field.onChange(date ?? undefined)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <p className="text-xs text-muted-foreground">Track Page 2 completion once CAPA actions close.</p>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="sourceOfCapa"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Source of CAPA</FormLabel>
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
              name="complaintReference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Complaint No. / NC No. / Audit Finding No. (If Applicable)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      placeholder="Provide the related reference, if available"
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
              name="capaCategory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CAPA Category (Systemic / Process / Design / Supplier / Training)</FormLabel>
                  <Select value={field.value ?? undefined} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select CAPA category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CAPA_CATEGORY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                <FormLabel>Description of the Issue / Finding</FormLabel>
                <FormControl>
                    <GrammarInput
                      {...field}
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      placeholder="Provide a concise description of the issue or finding."
                      className="min-h-[120px]"
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
                  <GrammarInput
                    {...field}
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    placeholder="Immediate containment or correction actions"
                    className="min-h-[80px]"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="correctiveAction"
              render={({ field }) => (
                <FormItem>
                <FormLabel>Corrective Action</FormLabel>
                <FormControl>
                    <GrammarInput
                      {...field}
                      value={field.value ?? ""}
                      onChange={field.onChange}
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
                    <GrammarInput
                      {...field}
                      value={field.value ?? ""}
                      onChange={field.onChange}
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
              name="extensionJustification"
              render={({ field }) => (
                <FormItem>
                <FormLabel>Justification (if extension is required) and proposed extension time</FormLabel>
                <FormControl>
                    <GrammarInput
                      {...field}
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      placeholder="Document the rationale for any requested extension and proposed timeline"
                      className="min-h-[80px]"
                    />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

            <FormField
              control={form.control}
              name="effectivenessPlan"
              render={({ field }) => (
                <FormItem>
                <FormLabel>Plan for CAPA Effectiveness Verification</FormLabel>
                <FormControl>
                    <GrammarInput
                      {...field}
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      placeholder="Outline how effectiveness of the CAPA will be verified"
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
              name="effectivenessReviewDueDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Effectiveness Review Due Date</FormLabel>
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
                        onSelect={(date) => field.onChange(date ?? undefined)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="capaClosureDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>CAPA Closure Date</FormLabel>
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
                        onSelect={(date) => field.onChange(date ?? undefined)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="impactsSafetyOrCompliance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Does this issue impact product safety or regulatory compliance?</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      placeholder="Indicate impact (e.g., “Yes – potential labeling risk”)"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isRepeated"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Is this issue repeated?</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      placeholder="Describe recurrence history"
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
              name="proceedToCapa"
              render={({ field }) => (
                <FormItem className="space-y-4 rounded-md border p-4">
                  <div>
                    <FormLabel>Proceed to CAPA?</FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Select Yes when CAPA escalation is required.
                    </p>
                  </div>
                  <FormControl>
                    <RadioGroup
                      className="grid grid-cols-2 gap-4"
                      value={field.value ? "yes" : "no"}
                      onValueChange={(value) => field.onChange(value === "yes")}
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="yes" />
                        </FormControl>
                        <FormLabel className="text-sm font-normal">Yes</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="no" />
                        </FormControl>
                        <FormLabel className="text-sm font-normal">No</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isCapaClosed"
              render={({ field }) => (
                <FormItem className="space-y-4 rounded-md border p-4">
                  <div>
                    <FormLabel>CAPA Close</FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Select Yes if the CAPA can be closed; otherwise choose No.
                    </p>
                  </div>
                  <FormControl>
                    <RadioGroup
                      className="grid grid-cols-2 gap-4"
                      value={field.value ? "yes" : "no"}
                      onValueChange={(value) => field.onChange(value === "yes")}
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="yes" />
                        </FormControl>
                        <FormLabel className="text-sm font-normal">Yes</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="no" />
                        </FormControl>
                        <FormLabel className="text-sm font-normal">No</FormLabel>
                      </FormItem>
                    </RadioGroup>
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
              {hasInlinePdf ? (
                <Button type="button" variant="secondary" size="sm" onClick={handleDownloadPdf}>
                  Download PDF
                </Button>
              ) : resolvedDownloadUrl ? (
                <Button asChild variant="secondary" size="sm">
                  <Link href={resolvedDownloadUrl} target="_blank" rel="noopener noreferrer">
                    View PDF
                  </Link>
                </Button>
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground">
              Store the CAPA ID in the associated complaint or NC record. Use the download button above to save the generated PDF immediately.
            </p>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
