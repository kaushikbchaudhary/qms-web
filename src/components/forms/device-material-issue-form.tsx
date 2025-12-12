"use client"

import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateDeviceMaterialIssue, useUpdateDeviceMaterialIssue } from '@/hooks/api/useDeviceMaterialIssues';
import {
  CreateDeviceMaterialIssuePayload,
  DeviceMaterialIssuePriority,
  UpdateDeviceMaterialIssuePayload,
} from '@/lib/api/types/deviceMaterialIssue';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export const MODEL_NUMBER_OPTIONS = ['OOM 100', 'OOM 7C', 'OOM 12C', 'OOM 12CR'] as const;

export const deviceMaterialIssueFormSchema = z.object({
  deviceName: z.string().trim().min(1, 'Device or material name is required.'),
  modelNumber: z.enum(MODEL_NUMBER_OPTIONS).optional(),
  purpose: z.string().trim().min(1, 'Purpose is required.'),
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1.'),
});

export type DeviceMaterialIssueFormValues = z.infer<typeof deviceMaterialIssueFormSchema>;
export type DeviceMaterialIssueFormInputs = z.input<typeof deviceMaterialIssueFormSchema>;

type DeviceMaterialIssueFormProps = {
  mode?: 'create' | 'edit';
  issueId?: string;
  initialValues?: Partial<DeviceMaterialIssueFormInputs>;
  onSuccess?: () => void;
  submitLabel?: string;
};

const normalizeModelNumber = (value?: string | null) => {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!(MODEL_NUMBER_OPTIONS as readonly string[]).includes(trimmed)) {
    return undefined;
  }
  return trimmed as (typeof MODEL_NUMBER_OPTIONS)[number];
};

export function DeviceMaterialIssueForm({
  mode = 'create',
  issueId,
  initialValues,
  onSuccess,
  submitLabel,
}: DeviceMaterialIssueFormProps) {
  const isEditMode = mode === 'edit';
  const createMutation = useCreateDeviceMaterialIssue();
  const updateMutation = useUpdateDeviceMaterialIssue(issueId ?? '');
  const router = useRouter();

  const resolvedDefaults: DeviceMaterialIssueFormInputs = useMemo(
    () => ({
      deviceName: initialValues?.deviceName ?? '',
      modelNumber: normalizeModelNumber(initialValues?.modelNumber as string | undefined),
      purpose: initialValues?.purpose ?? '',
      quantity:
        typeof initialValues?.quantity === 'number'
          ? initialValues.quantity
          : Number(initialValues?.quantity) || 1,
    }),
    [initialValues?.deviceName, initialValues?.modelNumber, initialValues?.purpose, initialValues?.quantity],
  );

  const form = useForm<DeviceMaterialIssueFormInputs>({
    resolver: zodResolver(deviceMaterialIssueFormSchema),
    defaultValues: resolvedDefaults,
  });

  useEffect(() => {
    form.reset(resolvedDefaults);
  }, [form, resolvedDefaults]);

  const handleSubmit = async (values: DeviceMaterialIssueFormInputs) => {
    const parsed = deviceMaterialIssueFormSchema.parse(values);

    if (isEditMode) {
      if (!issueId) {
        toast.error('Unable to update: request id is missing.');
        return;
      }
      const updatePayload: UpdateDeviceMaterialIssuePayload = {
        device_details: {
          category: parsed.deviceName.trim(),
          model: parsed.modelNumber?.trim() || undefined,
          quantity: parsed.quantity,
        },
        purpose: {
          description: parsed.purpose.trim(),
        },
      };

      await updateMutation.mutateAsync(updatePayload, {
        onSuccess,
      });
      return;
    }

    const payload: CreateDeviceMaterialIssuePayload = {
      device_details: {
        category: parsed.deviceName.trim(),
        model: parsed.modelNumber?.trim() || undefined,
        quantity: parsed.quantity,
      },
      purpose: {
        description: parsed.purpose.trim(),
      },
      priority: 'MEDIUM' as DeviceMaterialIssuePriority,
      autoSubmit: true,
    };

    await createMutation.mutateAsync(payload, {
      onSuccess: (created) => {
        form.reset(resolvedDefaults);
        if (created && (created as any)._id) {
          router.push(`/dashboard/device-material-issues/${(created as any)._id}`);
          return;
        }
        onSuccess?.();
      },
    });
  };

  const isSubmitting = isEditMode ? updateMutation.isPending : createMutation.isPending;
  const submitText = submitLabel ?? (isEditMode ? 'Save changes' : 'Submit request');
  const pendingText = isEditMode ? 'Saving changes...' : 'Saving...';

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="deviceName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Device/Material name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="modelNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Model no. (if applicable)</FormLabel>
                <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select model number" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {MODEL_NUMBER_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="purpose"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Purpose</FormLabel>
              <FormControl>
                <Textarea placeholder="Describe the purpose" rows={3} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Required quantity</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  value={
                    typeof field.value === 'number' || typeof field.value === 'string'
                      ? field.value
                      : ''
                  }
                  onChange={(event) => field.onChange(event.target.value)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? pendingText : submitText}
        </Button>
      </form>
    </Form>
  );
}
