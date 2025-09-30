"use client"
import { Resolver, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { InvestigationFormData } from "@/lib/validations/complaint"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Textarea} from "@/components/ui/textarea";
import {useUpdateInvestigation} from "@/hooks/api/useComplaints";
import {Switch} from "@/components/ui/switch";
import { useInvestigationFormRequirements } from "@/hooks/useComplaintFormRequirements";
import { buildInvestigationFormSchema } from "@/lib/validations/complaintSubmission";
import { useEffect, useMemo } from "react";
export const root_cause= ["Device Failure", "Manufacturing Issue", "Labelling/IFU", "Customer Misuse", "No Fault Found"];
export function InvestigationForm({
                                      complaintId,
                                      defaultValues,
                                      onSuccess
                                  }: {
    complaintId: string
    defaultValues?: Partial<InvestigationFormData>
    onSuccess: () => void | Promise<void>
}) {
    const { requirements } = useInvestigationFormRequirements()
    const schema = useMemo(() => buildInvestigationFormSchema(requirements), [requirements])
    const resolver = useMemo(() => zodResolver(schema) as Resolver<InvestigationFormData>, [schema])

    const form = useForm<InvestigationFormData>({
        resolver,
        defaultValues
    })

    useEffect(() => {
        form.reset({ ...form.getValues() })
    }, [schema, form])

    const { mutateAsync, isPending } = useUpdateInvestigation(complaintId);

    async function onSubmit(data: InvestigationFormData) {
        try {
            await mutateAsync(data);
            await onSuccess();
        } catch (error) {
            console.error('Failed to update investigation:', error);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="investigation_date"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>12.1 Date of Investigation</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button variant="outline" className="pl-3 text-left font-normal">
                                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={field.value}
                                        onSelect={field.onChange}
                                        disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Root Cause Section */}
                <div className="space-y-4">
                    <h3 className="font-medium">12.3 Root Cause Identified</h3>
                    <FormField
                        control={form.control}
                        name="root_cause.identified"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Select root cause</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select root cause" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {/*<SelectItem value="Device Failure">Device Failure</SelectItem>*/}
                                        {/*<SelectItem value="Manufacturing Issue">Manufacturing Issue</SelectItem>*/}
                                        {root_cause.map((cause) => (
                                            <SelectItem key={cause} value={cause}>{cause}</SelectItem>
                                        ))}
                                        <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="root_cause.description"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Root Cause Description</FormLabel>
                                <FormControl>
                                    <Textarea
                                        {...field}
                                        value={field.value ?? ''}
                                        placeholder="Document the identified root cause. Required when 'Other' is selected."
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Corrective Action Section */}
                <div className="space-y-4">
                    <h3 className="font-medium">Corrective/Preventive Action (if applicable)</h3>
                    <FormField
                        control={form.control}
                        name="corrective_action"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Corrective/Preventive Action Details</FormLabel>
                                <FormControl>
                                    <Textarea
                                        {...field}
                                        value={field.value ?? ''}
                                        placeholder="Describe the corrective action taken"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* CAPA Section */}
                <div className="space-y-4">
                    <h3 className="font-medium">Corrective and Preventive Action (CAPA)</h3>
                    <FormField
                        control={form.control}
                        name="capa.initiated"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <FormLabel className="text-base">CAPA Initiated?</FormLabel>
                                </div>
                                <FormControl>
                                    <Switch
                                        checked={!!field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />

                    {form.watch("capa.initiated") && (
                        <>
                            <FormField
                                control={form.control}
                                name="capa.number"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>CAPA Number</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                value={field.value ?? ''}
                                                placeholder="Enter CAPA number"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="capa.details"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>CAPA Details</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                {...field}
                                                value={field.value ?? ''}
                                                placeholder="Describe the CAPA details"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </>
                    )}
                </div>

                {/* Action Taken Section */}
                <div className="space-y-4">
                    <h3 className="font-medium">Action Taken (if any)</h3>
                    <FormField
                        control={form.control}
                        name="action_taken"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Action Taken Description</FormLabel>
                                <FormControl>
                                    <Textarea
                                        {...field}
                                        value={field.value ?? ''}
                                        placeholder="Describe the action taken"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>



                <Button type="submit" disabled={form.formState.isSubmitting || isPending}>
                    {form.formState.isSubmitting || isPending ? "Saving..." : "Save Investigation"}
                </Button>
            </form>
        </Form>
    )
}
