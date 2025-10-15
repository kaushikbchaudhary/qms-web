"use client"

import { useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useCreateDeviceMaterialIssue } from '@/hooks/api/useDeviceMaterialIssues';
import { CreateDeviceMaterialIssuePayload, DeviceMaterialIssuePriority } from '@/lib/api/types/deviceMaterialIssue';
import { toast } from 'sonner';

const schema = z.object({
  requester_snapshot: z
    .object({
      name: z.string().min(1, 'Requester name is required'),
      department: z.string().optional(),
      contact_number: z.string().optional(),
      email: z.string().email().optional(),
    })
    .partial()
    .optional(),
  device_details: z.object({
    category: z.string().min(1, 'Device category is required'),
    model: z.string().optional(),
    specification: z.string().optional(),
    serial_number: z.string().optional(),
    quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
    unit: z.string().optional(),
    expected_use_duration: z.string().optional(),
  }),
  purpose: z.object({
    description: z.string().min(1, 'Purpose description is required'),
    project_code: z.string().optional(),
    client_reference: z.string().optional(),
    justification: z.string().optional(),
  }),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  autoSubmit: z.boolean().default(true),
});

type DeviceIssueFormSchema = z.infer<typeof schema>;
type DeviceIssueFormInputs = z.input<typeof schema>;

const PRIORITY_OPTIONS: DeviceMaterialIssuePriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

export function DeviceMaterialIssueForm() {
  const { mutateAsync, isPending } = useCreateDeviceMaterialIssue();

  const form = useForm<DeviceIssueFormInputs>({
    resolver: zodResolver(schema),
    defaultValues: {
      requester_snapshot: {
        name: '',
        department: '',
        contact_number: '',
        email: '',
      },
      device_details: {
        category: '',
        quantity: 1,
        unit: '',
        model: '',
        specification: '',
        serial_number: '',
        expected_use_duration: '',
      },
      purpose: {
        description: '',
        project_code: '',
        client_reference: '',
        justification: '',
      },
      priority: 'MEDIUM',
      autoSubmit: true,
    },
  });

  const onSubmit = useCallback(
    async (values: DeviceIssueFormInputs) => {
      const parsed = schema.parse(values);

      const payload: CreateDeviceMaterialIssuePayload = {
        requester_snapshot: parsed.requester_snapshot,
        device_details: parsed.device_details,
        purpose: parsed.purpose,
        priority: parsed.priority as DeviceMaterialIssuePriority,
        autoSubmit: parsed.autoSubmit,
      };

      await mutateAsync(payload, {
        onSuccess: () => {
          toast.success('Device material issue request created');
          form.reset();
        },
      });
    },
    [form, mutateAsync],
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Requester information</h2>
            <p className="text-sm text-muted-foreground">
              Pre-filled from your profile where available. Update if you are submitting on behalf of a teammate.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="requester_snapshot.name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Requester name</FormLabel>
                  <FormControl>
                    <Input placeholder="Alex Operator" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="requester_snapshot.department"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Department</FormLabel>
                  <FormControl>
                    <Input placeholder="Production" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="requester_snapshot.contact_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact number</FormLabel>
                  <FormControl>
                    <Input placeholder="+1 555 0100" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="requester_snapshot.email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="alex@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Device details</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="device_details.category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Device / material category</FormLabel>
                  <FormControl>
                    <Input placeholder="Sterile patch kit" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="device_details.model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Model</FormLabel>
                  <FormControl>
                    <Input placeholder="MODEL-01" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="device_details.serial_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Serial / batch</FormLabel>
                  <FormControl>
                    <Input placeholder="BATCH-2024-0001" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="device_details.quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
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
              <FormField
                control={form.control}
                name="device_details.unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <FormControl>
                      <Input placeholder="boxes, packs" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="device_details.specification"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Key specifications</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Calibration standard, sterilisation requirements, etc." {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="device_details.expected_use_duration"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Expected use duration</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 2-week validation" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Purpose & references</h2>
          </div>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="purpose.description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Purpose description</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Why is this device/material required?" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="purpose.project_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project code</FormLabel>
                    <FormControl>
                      <Input placeholder="MFG-221" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="purpose.client_reference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client reference</FormLabel>
                    <FormControl>
                      <Input placeholder="Customer PO" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="purpose.justification"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Justification</FormLabel>
                    <FormControl>
                      <Input placeholder="Short justification" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Workflow preferences</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PRIORITY_OPTIONS.map((option) => (
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
            <FormField
              control={form.control}
              name="autoSubmit"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-md border p-3">
                  <div className="space-y-1">
                    <FormLabel>Submit immediately</FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Disable to save as draft and continue later.
                    </p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </section>

        <div className="flex justify-end gap-3">
          <Button type="reset" variant="outline" onClick={() => form.reset()}>
            Reset
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Submitting…' : 'Create request'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
