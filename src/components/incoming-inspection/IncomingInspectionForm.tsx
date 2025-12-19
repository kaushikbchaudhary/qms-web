"use client";

import { useEffect, useMemo, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { IncomingInspectionPreview } from './IncomingInspectionPreview';
import { DEFAULT_CHECKLISTS, COMPONENT_LABELS } from './constants';
import {
  CreateIncomingInspectionPayload,
  IncomingInspectionComponentType,
  IncomingInspectionResult,
  UpdateIncomingInspectionPayload,
} from '@/lib/api/types/incomingInspection';
import { useCreateIncomingInspection, useUpdateIncomingInspection } from '@/hooks/api/useIncomingInspections';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api/client';

const formatBatchLot = (mpn?: string, dateStr?: string) => {
  if (!mpn || !dateStr) return '';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '';
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yy = String(date.getFullYear()).slice(-2);
  return `${mpn}/${dd}${mm}${yy}`;
};

const componentTypes = [
  'CONNECTOR',
  'CRYSTAL',
  'DIODE',
  'HEADER',
  'SWITCH',
  'TRANSISTOR',
  'USB_MICRO_B',
  'INDUCTOR',
  'SWITCH_DIMENSION',
  'USB_TYPE_C',
] as const satisfies IncomingInspectionComponentType[];

const COMPONENT_CATEGORY_MAP: Partial<Record<IncomingInspectionComponentType, string>> = {
  CONNECTOR: 'CONNECTOR',
  CRYSTAL: 'CRYSTAL',
  DIODE: 'DIODE',
  HEADER: 'HEADER',
  SWITCH: 'SWITCH',
  SWITCH_DIMENSION: 'SWITCH',
  TRANSISTOR: 'TRANSISTOR',
  USB_MICRO_B: 'CONNECTOR',
  USB_TYPE_C: 'TYPE-C CONNECTOR',
  INDUCTOR: 'INDUCTOR',
};

type MaterialMaster = {
  _id: string;
  name: string;
  config?: {
    category?: string;
    description?: string;
  };
};

const inspectionSchema = z.object({
  component_type: z.enum(componentTypes),
  details: z.object({
    material_name: z.string().trim().optional(),
    batch_lot_no: z.string().trim().optional(),
    inward_date: z.string().optional(),
    inward_quantity: z.coerce.number().optional(),
    mpn_no: z.string().trim().optional(),
    material_master_id: z.string().trim().optional(),
    material_category: z.string().trim().optional(),
  }),
  sampling: z.object({
    total_sample_tested: z.coerce.number().optional(),
    sample_number: z.string().trim().optional(),
  }),
  inspection_checklist: z.array(
    z.object({
      sr_no: z.number(),
      test_name: z.string(),
      specification: z.string(),
      observation: z.string().optional(),
      result: z.enum(['PASS', 'FAIL']).optional(),
    }),
  ),
  release_decision: z.object({
    overall_result: z.enum(['PASS', 'FAIL']).optional(),
    released: z.boolean().optional(),
  }),
  tested_by: z.object({
    name: z.string().trim().optional(),
    signed_at: z.string().optional(),
  }),
  approved_by: z.object({
    name: z.string().trim().optional(),
    signed_at: z.string().optional(),
  }),
});

export type IncomingInspectionFormValues = z.infer<typeof inspectionSchema>;
export type IncomingInspectionFormInputs = z.input<typeof inspectionSchema>;

type IncomingInspectionFormProps = {
  mode?: 'create' | 'edit';
  inspectionId?: string;
  initialValues?: Partial<IncomingInspectionFormInputs>;
  onSuccess?: () => void;
  submitLabel?: string;
};

const buildDefaults = (values?: Partial<IncomingInspectionFormInputs>): IncomingInspectionFormInputs => {
  const componentType = values?.component_type ?? 'CONNECTOR';
  return {
    component_type: componentType,
    details: {
      material_name: values?.details?.material_name ?? '',
      batch_lot_no: values?.details?.batch_lot_no ?? '',
      inward_date: values?.details?.inward_date ?? '',
      inward_quantity: values?.details?.inward_quantity ?? undefined,
      mpn_no: values?.details?.mpn_no ?? '',
      material_master_id: values?.details?.material_master_id ?? '',
      material_category: values?.details?.material_category ?? '',
    },
    sampling: {
      total_sample_tested: values?.sampling?.total_sample_tested ?? undefined,
      sample_number: values?.sampling?.sample_number ?? '',
    },
    release_decision: {
      overall_result: values?.release_decision?.overall_result,
      released: values?.release_decision?.released,
    },
    inspection_checklist:
      values?.inspection_checklist && values.inspection_checklist.length > 0
        ? values.inspection_checklist
        : DEFAULT_CHECKLISTS[componentType],
    tested_by: {
      name: values?.tested_by?.name ?? '',
      signed_at: values?.tested_by?.signed_at ?? '',
    },
    approved_by: {
      name: values?.approved_by?.name ?? '',
      signed_at: values?.approved_by?.signed_at ?? '',
    },
  };
};

export function IncomingInspectionForm({
  mode = 'create',
  inspectionId,
  initialValues,
  onSuccess,
  submitLabel,
}: IncomingInspectionFormProps) {
  const isEditMode = mode === 'edit';
  const createMutation = useCreateIncomingInspection();
  const updateMutation = useUpdateIncomingInspection(inspectionId ?? '');
  const router = useRouter();
  const [materials, setMaterials] = useState<MaterialMaster[]>([]);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('');

  const resolvedDefaults = useMemo<IncomingInspectionFormInputs>(() => buildDefaults(initialValues), [initialValues]);

  const form = useForm<IncomingInspectionFormInputs>({
    resolver: zodResolver(inspectionSchema),
    defaultValues: resolvedDefaults,
  });

  const { fields, replace } = useFieldArray({
    control: form.control,
    name: 'inspection_checklist',
  });

  const selectedComponent = form.watch('component_type');

  useEffect(() => {
    form.reset(resolvedDefaults);
  }, [form, resolvedDefaults]);

  // Auto-select material based on component category mapping
  useEffect(() => {
    const category = COMPONENT_CATEGORY_MAP[selectedComponent];
    if (!category || materials.length === 0) return;
    const matching = materials.find(
      (item) => item.config?.category?.toUpperCase() === category.toUpperCase(),
    );
    if (matching) {
      setSelectedMaterialId(matching._id);
      // Material name reflects component type label; MPN uses master name
      form.setValue('details.material_name', COMPONENT_LABELS[selectedComponent]);
      form.setValue('details.mpn_no', matching.name);
      form.setValue('details.material_master_id', matching._id);
      form.setValue('details.material_category', matching.config?.category ?? '');
    }
  }, [selectedComponent, materials, form]);

  // Auto-fill batch/lot using MPN + inward date (format: MPN/DDMMYY)
  const mpnValue = form.watch('details.mpn_no');
  const inwardDateValue = form.watch('details.inward_date');
  useEffect(() => {
    const autoBatch = formatBatchLot(mpnValue, inwardDateValue);
    const currentBatch = form.getValues('details.batch_lot_no');
    if (autoBatch && (!currentBatch || currentBatch === autoBatch)) {
      form.setValue('details.batch_lot_no', autoBatch);
    }
  }, [mpnValue, inwardDateValue, form]);

  useEffect(() => {
    let isActive = true;
    apiClient
      .get('/api/v1/master/lookup', { params: { type: 'MATERIAL' } })
      .then((response) => {
        if (!isActive) return;
        const items = Array.isArray(response?.data) ? response.data : response?.data?.data;
        if (Array.isArray(items)) {
          setMaterials(items);
        }
      })
      .catch(() => {
        if (isActive) setMaterials([]);
      });

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedComponent) return;
    const nextDefaults = DEFAULT_CHECKLISTS[selectedComponent];
    if (!isEditMode) {
      replace(nextDefaults);
    }
  }, [selectedComponent, replace, isEditMode]);

  const handleSubmit = async (values: IncomingInspectionFormInputs) => {
    const parsed = inspectionSchema.parse(values);

    if (isEditMode) {
      if (!inspectionId) {
        toast.error('Unable to update: inspection id is missing.');
        return;
      }
      const payload: UpdateIncomingInspectionPayload = parsed;
      await updateMutation.mutateAsync(payload, { onSuccess });
      return;
    }

    const payload: CreateIncomingInspectionPayload = parsed;
    await createMutation.mutateAsync(payload, {
      onSuccess: (created: any) => {
        if (created?._id) {
          router.push(`/dashboard/incoming-inspections/${created._id}`);
          return;
        }
        onSuccess?.();
      },
    });
  };

  const isSubmitting = isEditMode ? updateMutation.isPending : createMutation.isPending;
  const submitText = submitLabel ?? (isEditMode ? 'Save changes' : 'Create inspection');
  const pendingText = isEditMode ? 'Saving changes...' : 'Saving...';

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="component_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Component type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select component" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {componentTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {COMPONENT_LABELS[type]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FormItem>
              <FormLabel>Material master</FormLabel>
              <Select
                onValueChange={(value) => {
                  setSelectedMaterialId(value);
                  const selected = materials.find((item) => item._id === value);
                  if (selected) {
                    form.setValue('details.material_name', COMPONENT_LABELS[selectedComponent]);
                    form.setValue('details.mpn_no', selected.name);
                    form.setValue('details.material_master_id', selected._id);
                    form.setValue('details.material_category', selected.config?.category ?? '');
                  }
                }}
                value={selectedMaterialId}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select material (optional)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {materials.map((material) => (
                    <SelectItem key={material._id} value={material._id}>
                      {material.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
            <FormField
              control={form.control}
              name="details.material_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Material name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter material name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="details.batch_lot_no"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Batch/Lot no.</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter batch or lot no." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="details.inward_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Inward date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="details.inward_quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Inward quantity</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      value={
                        field.value === undefined || field.value === null
                          ? ''
                          : typeof field.value === 'number'
                            ? field.value
                            : Number(field.value)
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        field.onChange(val === '' ? undefined : Number(val));
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="details.mpn_no"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>MPN no. (if applicable)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter MPN" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="sampling.total_sample_tested"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total sample tested</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      value={
                        field.value === undefined || field.value === null
                          ? ''
                          : typeof field.value === 'number'
                            ? field.value
                            : Number(field.value)
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        field.onChange(val === '' ? undefined : Number(val));
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sampling.sample_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sample number</FormLabel>
                  <FormControl>
                    <Input placeholder="Sample number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-3 rounded-lg border border-muted p-4">
            <div className="text-sm font-semibold">Inspection checklist</div>
            {fields.map((fieldItem, index) => (
              <div key={fieldItem.id} className="grid gap-3 rounded-md border p-3">
                <div className="text-xs font-medium">
                  {fieldItem.sr_no}. {fieldItem.test_name}
                </div>
                <div className="text-xs text-muted-foreground">{fieldItem.specification}</div>
                <FormField
                  control={form.control}
                  name={`inspection_checklist.${index}.observation`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observation</FormLabel>
                      <FormControl>
                        <Input placeholder="Observation" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`inspection_checklist.${index}.result`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Result</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value ?? ''}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select result" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(['PASS', 'FAIL'] as IncomingInspectionResult[]).map((result) => (
                            <SelectItem key={result} value={result}>
                              {result}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="release_decision.overall_result"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Overall result</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ?? ''}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select result" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="PASS">PASS</SelectItem>
                      <SelectItem value="FAIL">FAIL</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="release_decision.released"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Released for further use</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value === 'true')}
                    value={field.value === undefined ? '' : String(field.value)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select release" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="true">Released</SelectItem>
                      <SelectItem value="false">Not released</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="tested_by.name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tested by (QC)</FormLabel>
                  <FormControl>
                    <Input placeholder="QC name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tested_by.signed_at"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tested date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="approved_by.name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Approved by (QA)</FormLabel>
                  <FormControl>
                    <Input placeholder="QA name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="approved_by.signed_at"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Approved date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? pendingText : submitText}
          </Button>
        </form>
      </Form>

      <IncomingInspectionPreview
        componentType={selectedComponent}
        details={{
          ...form.watch('details'),
          inward_quantity:
            form.watch('details')?.inward_quantity === undefined ||
            form.watch('details')?.inward_quantity === null
              ? undefined
              : Number(form.watch('details')?.inward_quantity),
        }}
        sampling={{
          ...form.watch('sampling'),
          total_sample_tested:
            form.watch('sampling')?.total_sample_tested === undefined ||
            form.watch('sampling')?.total_sample_tested === null
              ? undefined
              : Number(form.watch('sampling')?.total_sample_tested),
        }}
        checklist={form.watch('inspection_checklist')}
        releaseDecision={form.watch('release_decision')}
        testedBy={form.watch('tested_by')}
        approvedBy={form.watch('approved_by')}
      />
    </div>
  );
}
