"use client";

import { useEffect, useMemo, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
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
import { useUsersByRole } from '@/hooks/api/useUsers';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api/client';

const Required = () => <span className="ml-0.5 text-destructive">*</span>;

const COMPONENT_ORDER: IncomingInspectionComponentType[] = [
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
];

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

const checklistSchema = z.object({
  sr_no: z.number(),
  test_name: z.string().min(1),
  specification: z.string().min(1),
  observation: z.string().min(1),
  result: z.enum(['PASS', 'FAIL']),
});

const signatureSchema = z.object({
  user: z.string().trim().min(1),
  name: z.string().trim().min(1),
  signed_at: z.string().min(1),
  signature_path: z.string().trim().optional(),
});

const componentSchema = z.object({
  component_type: z.enum(COMPONENT_ORDER),
  details: z.object({
    material_name: z.string().trim().min(1),
    batch_lot_no: z.string().trim().min(1),
    inward_date: z.string().min(1),
    inward_quantity: z.coerce.number(),
    mpn_no: z.string().trim().min(1),
    material_master_id: z.string().trim().min(1),
    material_category: z.string().trim().min(1),
  }),
  sampling: z.object({
    total_sample_tested: z.coerce.number(),
    sample_number: z.string().trim().min(1),
  }),
  inspection_checklist: z.array(checklistSchema).min(1),
  release_decision: z.object({
    overall_result: z.enum(['PASS', 'FAIL']),
    released: z.boolean(),
  }),
  tested_by: signatureSchema,
  approved_by: signatureSchema,
});

const inspectionSchema = z.object({
  components: z.array(componentSchema).min(1),
  status: z.enum(['DRAFT', 'FINALIZED']).optional(),
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

const formatBatchLot = (mpn?: string, dateStr?: string) => {
  if (!mpn || !dateStr) return '';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '';
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yy = String(date.getFullYear()).slice(-2);
  return `${mpn}/${dd}${mm}${yy}`;
};

const buildComponentDefaults = (
  type: IncomingInspectionComponentType,
  values?: Partial<IncomingInspectionFormInputs['components'][number]>,
): IncomingInspectionFormInputs['components'][number] => {
  const defaults = DEFAULT_CHECKLISTS[type];
  const normalizeChecklist = (list?: IncomingInspectionFormInputs['components'][number]['inspection_checklist']) => {
    const source = list && list.length ? list : defaults;
    return source.map((row) => ({
      sr_no: row.sr_no,
      test_name: row.test_name,
      specification: row.specification,
      observation: row.observation ?? 'Result as per specification',
      result: (row.result as IncomingInspectionResult | undefined) ?? 'PASS',
    }));
  };
  return {
    component_type: type,
    details: {
      material_name: values?.details?.material_name ?? COMPONENT_LABELS[type],
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
    inspection_checklist: normalizeChecklist(values?.inspection_checklist),
    release_decision: {
      overall_result: values?.release_decision?.overall_result ?? 'PASS',
      released: values?.release_decision?.released ?? false,
    },
    tested_by: {
      user: values?.tested_by?.user ?? '',
      name: values?.tested_by?.name ?? '',
      signed_at: values?.tested_by?.signed_at ?? '',
      signature_path: values?.tested_by?.signature_path ?? '',
    },
    approved_by: {
      user: values?.approved_by?.user ?? '',
      name: values?.approved_by?.name ?? '',
      signed_at: values?.approved_by?.signed_at ?? '',
      signature_path: values?.approved_by?.signature_path ?? '',
    },
  };
};

const buildDefaults = (values?: Partial<IncomingInspectionFormInputs>): IncomingInspectionFormInputs => {
  const provided = values?.components ?? [];
  const normalized = COMPONENT_ORDER.map((type) => {
    const existing = provided.find((c) => c?.component_type === type);
    return buildComponentDefaults(type, existing);
  });
  return {
    components: normalized,
    status: values?.status ?? 'DRAFT',
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
  const qcUsersQuery = useUsersByRole(['qc-team']);
  const qaUsersQuery = useUsersByRole(['quality-assurance']);
  const [currentStep, setCurrentStep] = useState(0);

  const resolvedDefaults = useMemo<IncomingInspectionFormInputs>(() => buildDefaults(initialValues), [initialValues]);

  const form = useForm<IncomingInspectionFormInputs>({
    resolver: zodResolver(inspectionSchema),
    defaultValues: resolvedDefaults,
  });

  const { fields: componentFields, replace: replaceComponents } = useFieldArray({
    control: form.control,
    name: 'components',
  });

  useEffect(() => {
    form.reset(resolvedDefaults);
    replaceComponents(resolvedDefaults.components);
  }, [form, resolvedDefaults, replaceComponents]);

  // Material master lookup
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

  // Auto-select material/MPN/batch per component
  useEffect(() => {
    const component = form.getValues(`components.${currentStep}`);
    if (!component) return;
    const category = COMPONENT_CATEGORY_MAP[component.component_type];
    if (!category || materials.length === 0) return;
    const matching = materials.find(
      (item) => item.config?.category?.toUpperCase() === category.toUpperCase(),
    );
    if (matching) {
      form.setValue(`components.${currentStep}.details.material_name`, COMPONENT_LABELS[component.component_type]);
      form.setValue(`components.${currentStep}.details.mpn_no`, matching.name);
      form.setValue(`components.${currentStep}.details.material_master_id`, matching._id);
      form.setValue(`components.${currentStep}.details.material_category`, matching.config?.category ?? '');
      const inwardDate = form.getValues(`components.${currentStep}.details.inward_date`);
      const autoBatch = formatBatchLot(matching.name, inwardDate);
      if (autoBatch) {
        form.setValue(`components.${currentStep}.details.batch_lot_no`, autoBatch);
      }
    }
  }, [currentStep, form, materials]);

  // Auto batch update when MPN/date changes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (!name?.includes('details.mpn_no') && !name?.includes('details.inward_date')) return;
      const compIdx = currentStep;
      const mpn = value?.components?.[compIdx]?.details?.mpn_no;
      const inwardDate = value?.components?.[compIdx]?.details?.inward_date;
      const autoBatch = formatBatchLot(mpn, inwardDate);
      if (autoBatch) {
        form.setValue(`components.${compIdx}.details.batch_lot_no`, autoBatch);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, currentStep]);

  const handleSubmit = async (values: IncomingInspectionFormInputs) => {
    const parsed = inspectionSchema.parse(values);
    const payload: CreateIncomingInspectionPayload = parsed;

    if (isEditMode) {
      if (!inspectionId) {
        toast.error('Unable to update: inspection id is missing.');
        return;
      }
      const updatePayload: UpdateIncomingInspectionPayload = payload;
      await updateMutation.mutateAsync(updatePayload, { onSuccess });
      return;
    }

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

  const currentComponent = form.watch(`components.${currentStep}`);

  const renderStepLabels = () => (
    <div className="flex flex-wrap gap-2">
      {COMPONENT_ORDER.map((type, idx) => {
        const completed = Boolean(
          form.getValues(`components.${idx}.release_decision.overall_result`) &&
            form.getValues(`components.${idx}.release_decision.released`) !== undefined,
        );
        return (
          <Button
            key={type}
            type="button"
            variant={idx === currentStep ? 'default' : completed ? 'secondary' : 'outline'}
            onClick={() => setCurrentStep(idx)}
            size="sm"
          >
            {idx + 1}. {COMPONENT_LABELS[type]} {completed ? '✔' : ''}
          </Button>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-6">
      {renderStepLabels()}
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name={`components.${currentStep}.component_type`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Component type <Required />
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select component" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {COMPONENT_ORDER.map((type) => (
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

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name={`components.${currentStep}.details.material_name`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Material name <Required />
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Enter material name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`components.${currentStep}.details.batch_lot_no`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Batch/Lot no. <Required />
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Enter batch or lot no." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`components.${currentStep}.details.inward_date`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Inward date <Required />
                    </FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`components.${currentStep}.details.inward_quantity`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Inward quantity <Required />
                    </FormLabel>
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
                name={`components.${currentStep}.details.mpn_no`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      MPN no. (if applicable) <Required />
                    </FormLabel>
                    <div className="grid gap-2">
                      <FormControl>
                        <Input placeholder="Enter MPN" {...field} />
                      </FormControl>
                      <Select
                        onValueChange={(value) => {
                          const selected = materials.find((item) => item._id === value);
                          if (selected) {
                            form.setValue(`components.${currentStep}.details.material_name`, COMPONENT_LABELS[currentComponent.component_type]);
                            form.setValue(`components.${currentStep}.details.mpn_no`, selected.name);
                            form.setValue(`components.${currentStep}.details.material_master_id`, selected._id);
                            form.setValue(`components.${currentStep}.details.material_category`, selected.config?.category ?? '');
                            const inwardDate = form.getValues(`components.${currentStep}.details.inward_date`);
                            const autoBatch = formatBatchLot(selected.name, inwardDate);
                            if (autoBatch) {
                              form.setValue(`components.${currentStep}.details.batch_lot_no`, autoBatch);
                            }
                          }
                        }}
                        value={form.getValues(`components.${currentStep}.details.material_master_id`) || ''}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select material (MPN)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(materials ?? []).length === 0 ? (
                            <SelectItem value="__no_material__" disabled>
                              No materials
                            </SelectItem>
                          ) : (
                            materials.map((material) => (
                              <SelectItem key={material._id} value={material._id}>
                                {material.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name={`components.${currentStep}.sampling.total_sample_tested`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Total sample tested <Required />
                    </FormLabel>
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
                name={`components.${currentStep}.sampling.sample_number`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Sample number <Required />
                    </FormLabel>
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
              {componentFields[currentStep]?.inspection_checklist?.map?.(() => null)}
              {form.watch(`components.${currentStep}.inspection_checklist`)?.map((row, index) => (
                <div key={`${row.sr_no}-${row.test_name}-${index}`} className="grid gap-3 rounded-md border p-3">
                  <div className="text-xs font-medium">
                    {row.sr_no}. {row.test_name}
                  </div>
                  <div className="text-xs text-muted-foreground">{row.specification}</div>
                  <FormField
                    control={form.control}
                    name={`components.${currentStep}.inspection_checklist.${index}.observation`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Observation <Required />
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Observation" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`components.${currentStep}.inspection_checklist.${index}.result`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Result <Required />
                        </FormLabel>
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
                name={`components.${currentStep}.release_decision.overall_result`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Overall result <Required />
                    </FormLabel>
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
                name={`components.${currentStep}.release_decision.released`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Released for further use <Required />
                    </FormLabel>
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
                name={`components.${currentStep}.tested_by.user`}
                render={() => (
                  <FormItem>
                    <FormLabel>
                      Tested by (QC) <Required />
                    </FormLabel>
                    <Select
                      onValueChange={(value) => {
                        const selected = qcUsersQuery.data?.find((u) => u._id === value);
                        form.setValue(`components.${currentStep}.tested_by.user`, selected?._id ?? '');
                        form.setValue(`components.${currentStep}.tested_by.name`, selected?.displayName ?? '');
                        form.setValue(
                          `components.${currentStep}.tested_by.signature_path`,
                          selected?.signature?.path ?? '',
                        );
                        if (!form.getValues(`components.${currentStep}.tested_by.signed_at`)) {
                          form.setValue(
                            `components.${currentStep}.tested_by.signed_at`,
                            new Date().toISOString().slice(0, 10),
                          );
                        }
                      }}
                      value={
                        form.watch(`components.${currentStep}.tested_by.user`) ??
                        qcUsersQuery.data?.find((u) => u.displayName === form.watch(`components.${currentStep}.tested_by.name`))?._id ??
                        ''
                      }
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select QC user" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(qcUsersQuery.data ?? []).length === 0 ? (
                          <SelectItem value="__no_qc__" disabled>
                            No QC users
                          </SelectItem>
                        ) : (
                          qcUsersQuery.data?.map((user) => (
                            <SelectItem key={user._id} value={user._id}>
                              {user.displayName}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`components.${currentStep}.tested_by.signed_at`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Tested date <Required />
                    </FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`components.${currentStep}.approved_by.user`}
                render={() => (
                  <FormItem>
                    <FormLabel>
                      Approved by (QA) <Required />
                    </FormLabel>
                    <Select
                      onValueChange={(value) => {
                        const selected = qaUsersQuery.data?.find((u) => u._id === value);
                        form.setValue(`components.${currentStep}.approved_by.user`, selected?._id ?? '');
                        form.setValue(`components.${currentStep}.approved_by.name`, selected?.displayName ?? '');
                        form.setValue(
                          `components.${currentStep}.approved_by.signature_path`,
                          selected?.signature?.path ?? '',
                        );
                        if (!form.getValues(`components.${currentStep}.approved_by.signed_at`)) {
                          form.setValue(
                            `components.${currentStep}.approved_by.signed_at`,
                            new Date().toISOString().slice(0, 10),
                          );
                        }
                      }}
                      value={
                        form.watch(`components.${currentStep}.approved_by.user`) ??
                        qaUsersQuery.data?.find((u) => u.displayName === form.watch(`components.${currentStep}.approved_by.name`))?._id ??
                        ''
                      }
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select QA user" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(qaUsersQuery.data ?? []).length === 0 ? (
                          <SelectItem value="__no_qa__" disabled>
                            No QA users
                          </SelectItem>
                        ) : (
                          qaUsersQuery.data?.map((user) => (
                            <SelectItem key={user._id} value={user._id}>
                              {user.displayName}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`components.${currentStep}.approved_by.signed_at`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Approved date <Required />
                    </FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="flex gap-2">
                <Button type="button" variant="outline" disabled={currentStep === 0} onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}>
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={currentStep === COMPONENT_ORDER.length - 1}
                  onClick={() => setCurrentStep((s) => Math.min(COMPONENT_ORDER.length - 1, s + 1))}
                >
                  Next
                </Button>
              </div>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? pendingText : submitText}
              </Button>
            </div>
          </form>
        </Form>

        <IncomingInspectionPreview
          componentType={currentComponent?.component_type ?? 'CONNECTOR'}
          details={{
            ...currentComponent?.details,
            inward_quantity:
              currentComponent?.details?.inward_quantity === undefined ||
              currentComponent?.details?.inward_quantity === null
                ? undefined
                : Number(currentComponent?.details?.inward_quantity),
          }}
          sampling={{
            ...currentComponent?.sampling,
            total_sample_tested:
              currentComponent?.sampling?.total_sample_tested === undefined ||
              currentComponent?.sampling?.total_sample_tested === null
                ? undefined
                : Number(currentComponent?.sampling?.total_sample_tested),
          }}
          checklist={currentComponent?.inspection_checklist}
          releaseDecision={currentComponent?.release_decision}
          testedBy={currentComponent?.tested_by}
          approvedBy={currentComponent?.approved_by}
          testedSignaturePath={currentComponent?.tested_by?.signature_path}
          approvedSignaturePath={currentComponent?.approved_by?.signature_path}
        />
      </div>
    </div>
  );
}
