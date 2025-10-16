"use client"

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCreateDeviceMaterialIssue } from '@/hooks/api/useDeviceMaterialIssues';
import { CreateDeviceMaterialIssuePayload, DeviceMaterialIssuePriority } from '@/lib/api/types/deviceMaterialIssue';
import { toast } from 'sonner';

const schema = z.object({
  deviceName: z.string().trim().min(1, 'Device or material name is required.'),
  modelNumber: z.string().trim().optional(),
  purpose: z.string().trim().min(1, 'Purpose is required.'),
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1.'),
});

type FormValues = z.infer<typeof schema>;
type FormInputs = z.input<typeof schema>;

export function DeviceMaterialIssueForm() {
  const { mutateAsync, isPending } = useCreateDeviceMaterialIssue();

  const form = useForm<FormInputs>({
    resolver: zodResolver(schema),
    defaultValues: {
      deviceName: '',
      modelNumber: '',
      purpose: '',
      quantity: 1,
    },
  });

  const onSubmit = async (values: FormInputs) => {
    const parsed = schema.parse(values);
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

    await mutateAsync(payload, {
      onSuccess: () => {
        toast.success('Device/material issue request created.');
        form.reset();
      },
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                <FormControl>
                  <Input placeholder="Enter model number" {...field} />
                </FormControl>
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

        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving...' : 'Submit request'}
        </Button>
      </form>
    </Form>
  );
}
