"use client";

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import Link from 'next/link';
import { CalendarIcon, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useCreateNc } from '@/hooks/api/useNc';
import { CreateNcPayload, CreateNcResponse, NcSource, NcType } from '@/lib/api/types/nc';

const NC_TYPE_VALUES = ['critical', 'major', 'minor'] as const;
const SOURCE_VALUES = [
  'incoming-material',
  'in-process-inspection',
  'final-inspection',
  'customer-complaint',
  'post-market-surveillance',
  'other',
] as const;

const NC_TYPE_OPTIONS: Array<{ label: string; value: NcType }> = [
  { label: 'Critical', value: 'critical' },
  { label: 'Major', value: 'major' },
  { label: 'Minor', value: 'minor' },
];

const SOURCE_OPTIONS: Array<{ label: string; value: NcSource }> = [
  { label: 'Incoming Material', value: 'incoming-material' },
  { label: 'In-Process Inspection', value: 'in-process-inspection' },
  { label: 'Final Inspection', value: 'final-inspection' },
  { label: 'Customer Complaint', value: 'customer-complaint' },
  { label: 'Post-Market Surveillance', value: 'post-market-surveillance' },
  { label: 'Other (specify)', value: 'other' },
];

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value && value.length ? value : undefined));

const schema = z
  .object({
    reportDate: z.date(),
    reportedBy: z.string().trim().min(1, 'Reported by is required.'),
    department: z.string().trim().min(1, 'Department is required.'),
    ncType: z.enum(NC_TYPE_VALUES).optional(),
    description: z.string().trim().min(1, 'Description is required.'),
    sources: z.array(z.enum(SOURCE_VALUES)).min(1, 'Select at least one source.'),
    sourceOther: optionalText,
    productProcessName: optionalText,
    productCodeOrBatch: optionalText,
    serialNumber: optionalText,
    supplier: optionalText,
    capaRequired: z.boolean().default(false),
    capaNumber: optionalText,
    capaIssuedTo: optionalText,
    noCapaReason: optionalText,
    comments: optionalText,
    qaRemarks: optionalText,
    approverName: optionalText,
    approverDesignation: optionalText,
    approvalDate: z.date().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.ncType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['ncType'],
        message: 'Select a NC type.',
      });
    }

    if ((data.sources ?? []).includes('other') && !data.sourceOther) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['sourceOther'],
        message: 'Please describe the other source.',
      });
    }

    if (!data.capaRequired && !data.noCapaReason) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['noCapaReason'],
        message: 'Reason is required when CAPA is not required.',
      });
    }
  });

type FormValues = z.infer<typeof schema>;
type FormInputs = z.input<typeof schema>;

export function NcForm() {
  const { mutateAsync, isPending } = useCreateNc();
  const [result, setResult] = useState<CreateNcResponse | null>(null);
  const apiBaseUrl = useMemo(() => process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, '') ?? '', []);

  const form = useForm<FormInputs>({
    resolver: zodResolver(schema),
    defaultValues: {
      reportDate: new Date(),
      reportedBy: '',
      department: '',
      ncType: undefined,
      description: '',
      sources: [],
      sourceOther: undefined,
      productProcessName: undefined,
      productCodeOrBatch: undefined,
      serialNumber: undefined,
      supplier: undefined,
      capaRequired: false,
      capaNumber: undefined,
      capaIssuedTo: undefined,
      noCapaReason: undefined,
      comments: undefined,
      qaRemarks: undefined,
      approverName: undefined,
      approverDesignation: undefined,
      approvalDate: undefined,
    },
  });

  const selectedSources = form.watch('sources') ?? [];
  const includesOther = selectedSources.includes('other');
  const isCapaRequired = form.watch('capaRequired');

  const downloadUrl = result?.fileUrl
    ? `${apiBaseUrl ? `${apiBaseUrl}/` : ''}${result.fileUrl.replace(/^\/+/, '')}`
    : null;

  useEffect(() => {
    if (!includesOther) {
      form.setValue('sourceOther', undefined);
    }
  }, [includesOther, form]);

  useEffect(() => {
    if (isCapaRequired) {
      form.setValue('noCapaReason', undefined);
    } else {
      form.setValue('capaNumber', undefined);
      form.setValue('capaIssuedTo', undefined);
    }
  }, [form, isCapaRequired]);

  const handleSubmit = async (values: FormInputs) => {
    const parsed = schema.parse(values) as FormValues & { ncType: NcType };

    const payload: CreateNcPayload = {
      reportDate: parsed.reportDate.toISOString(),
      reportedBy: parsed.reportedBy,
      department: parsed.department,
      ncType: parsed.ncType,
      description: parsed.description,
      sources: parsed.sources,
      sourceOther: parsed.sourceOther,
      productProcessName: parsed.productProcessName,
      productCodeOrBatch: parsed.productCodeOrBatch,
      serialNumber: parsed.serialNumber,
      supplier: parsed.supplier,
      capaRequired: parsed.capaRequired,
      capaNumber: parsed.capaNumber,
      capaIssuedTo: parsed.capaIssuedTo,
      noCapaReason: parsed.noCapaReason,
      comments: parsed.comments,
      qaRemarks: parsed.qaRemarks,
      approverName: parsed.approverName,
      approverDesignation: parsed.approverDesignation,
      approvalDate: parsed.approvalDate ? parsed.approvalDate.toISOString() : undefined,
    };

    const response = await mutateAsync(payload);
    setResult(response);
    form.reset({
      reportDate: new Date(),
      reportedBy: '',
      department: '',
      ncType: undefined,
      description: '',
      sources: [],
      sourceOther: undefined,
      productProcessName: undefined,
      productCodeOrBatch: undefined,
      serialNumber: undefined,
      supplier: undefined,
      capaRequired: false,
      capaNumber: undefined,
      capaIssuedTo: undefined,
      noCapaReason: undefined,
      comments: undefined,
      qaRemarks: undefined,
      approverName: undefined,
      approverDesignation: undefined,
      approvalDate: undefined,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Non-Conformance Report</h2>
        <p className="text-sm text-muted-foreground">
          Complete this form to generate the NCR PDF (FOR/QAD/028/04). All signature blocks remain blank for manual
          sign-off after printing.
        </p>
      </div>

      {result ? (
        <Alert className="border-green-200 bg-green-50">
          <FileText className="h-4 w-4" />
          <AlertTitle>NC Report Generated</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>
              NCR Number: <span className="font-mono">{result.ncNumber}</span>
            </p>
            {downloadUrl ? (
              <Button asChild size="sm" variant="secondary">
                <Link href={downloadUrl} target="_blank" rel="noopener noreferrer">
                  Download PDF
                </Link>
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">Download URL unavailable.</p>
            )}
          </AlertDescription>
        </Alert>
      ) : null}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="reportDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date of Report</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button variant="outline" className="flex w-full justify-start gap-2 truncate">
                          {field.value ? format(field.value, 'PPP') : 'Select a date'}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date > new Date()}
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
              name="ncType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>NC Type</FormLabel>
                  <div className="grid grid-cols-3 gap-2">
                    {NC_TYPE_OPTIONS.map((option) => {
                      const isActive = field.value === option.value;
                      return (
                        <Button
                          key={option.value}
                          type="button"
                          variant={isActive ? 'default' : 'outline'}
                          className="w-full"
                          onClick={() => field.onChange(option.value)}
                        >
                          {option.label}
                        </Button>
                      );
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="reportedBy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reported By</FormLabel>
                  <FormControl>
                    <Input placeholder="Name of the reporter" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="department"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Department</FormLabel>
                  <FormControl>
                    <Input placeholder="Department responsible" {...field} />
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
                <FormLabel>Description of the Non-Conformance</FormLabel>
                <FormControl>
                  <Textarea rows={4} placeholder="Summarize the observed non-conformance" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sources"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Source of Non-Conformance</FormLabel>
                <FormDescription>Select all that apply.</FormDescription>
                <div className="flex flex-wrap gap-2">
                  {SOURCE_OPTIONS.map((option) => {
                    const isSelected = field.value?.includes(option.value);
                    return (
                      <Button
                        key={option.value}
                        type="button"
                        variant={isSelected ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          const current = field.value ?? [];
                          if (isSelected) {
                            field.onChange(current.filter((value) => value !== option.value));
                          } else {
                            field.onChange([...current, option.value]);
                          }
                        }}
                      >
                        {option.label}
                      </Button>
                    );
                  })}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {includesOther ? (
            <FormField
              control={form.control}
              name="sourceOther"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Other Source</FormLabel>
                  <FormControl>
                    <Input placeholder="Describe the other source" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : null}

          <div className="grid gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="productProcessName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product / Process Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Product or process linked to this NC" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="productCodeOrBatch"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Code / Batch Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Batch or code reference" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="serialNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Serial Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Serial number (if applicable)" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="supplier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Supplier</FormLabel>
                  <FormControl>
                    <Input placeholder="Supplier (if applicable)" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="capaRequired"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-md border p-4">
                  <div>
                    <FormLabel>CAPA Required?</FormLabel>
                    <FormDescription>Toggle this on to capture CAPA linkage information.</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            {isCapaRequired ? (
              <div className="grid gap-4">
                <FormField
                  control={form.control}
                  name="capaNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CAPA Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Reference CAPA ID" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="capaIssuedTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CAPA Issued To</FormLabel>
                      <FormControl>
                        <Input placeholder="Name or team responsible" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ) : null}
          </div>

          {!isCapaRequired ? (
            <FormField
              control={form.control}
              name="noCapaReason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason When CAPA Not Required</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Explain why CAPA is not issued" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : null}

          <FormField
            control={form.control}
            name="comments"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Comments</FormLabel>
                <FormControl>
                  <Textarea rows={3} placeholder="Additional context or comments" {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="qaRemarks"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>QA / MR Remarks</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Remarks for QA/MR" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4">
              <FormField
                control={form.control}
                name="approverName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Approved By</FormLabel>
                    <FormControl>
                      <Input placeholder="Approver name" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="approverDesignation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Designation</FormLabel>
                    <FormControl>
                      <Input placeholder="Approver designation" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="approvalDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Approval Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant="outline" className="flex w-full justify-start gap-2 truncate">
                            {field.value ? format(field.value, 'PPP') : 'Select a date'}
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
          </div>

          <Button type="submit" disabled={isPending} className="w-full md:w-auto">
            {isPending ? 'Generating PDF…' : 'Generate NC Report'}
          </Button>
        </form>
      </Form>
    </div>
  );
}
