"use client"
import {useFieldArray, useForm} from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { investigationSchema, InvestigationFormData } from "@/lib/validations/complaint"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Plus, Trash2 } from "lucide-react"
import { format } from "date-fns"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Textarea} from "@/components/ui/textarea";
import {useUpdateInvestigation} from "@/hooks/api/useComplaints";
import {InvestigationData} from "@/lib/api/types/complaints";
export const root_cause= ["Device Failure", "Manufacturing Issue", "Labeling/IFU", "Customer Misuse", "No Fault Found"];
export function InvestigationForm({
                                      complaintId,
                                      defaultValues,
                                      onSuccess
                                  }: {
    complaintId: string
    defaultValues?: Partial<InvestigationFormData>
    onSuccess: () => void
}) {

    const form = useForm<InvestigationFormData>({
        resolver: zodResolver(investigationSchema),
        defaultValues
    })

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "investigating_officers"
    })
    const { mutate, isPending } = useUpdateInvestigation(complaintId);

    async function onSubmit(data: InvestigationFormData) {
        console.log(data)
        mutate(data);
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="investigation_date"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Investigation Date</FormLabel>
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

                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="font-medium">Investigating Officers</h3>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => append({ sr_no: fields.length + 1, name: "", designation: "", signature: "" })}
                        >
                            <Plus className="mr-2 h-4 w-4" /> Add Officer
                        </Button>
                    </div>

                    {fields.map((field, index) => (
                        <div key={field.id} className="grid grid-cols-4 gap-4 items-end">
                            <FormField
                                control={form.control}
                                name={`investigating_officers.${index}.sr_no`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Sr. No</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            {/* Add other officer fields... */}
                            <FormField
                                control={form.control}
                                name={`investigating_officers.${index}.name`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Name</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name={`investigating_officers.${index}.designation`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Designation</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name={`investigating_officers.${index}.signature`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Signature</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => remove(index)}
                            >
                                <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                        </div>
                    ))}
                </div>

                {/* Root Cause Section */}
                <div className="space-y-4">
                    <h3 className="font-medium">Root Cause</h3>
                    <FormField
                        control={form.control}
                        name="root_cause.identified"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Identified</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select root cause" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {/*<SelectItem value="Device Failure">Device Failure</SelectItem>*/}
                                        {/*<SelectItem value="Manufacturing Issue">Manufacturing Issue</SelectItem>*/}
                                        {
                                            root_cause.map((cause) => (
                                                <SelectItem key={cause} value={cause}>{cause}</SelectItem>
                                            ))
                                        }
                                        <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {form.watch("root_cause.identified") === "Other" && (
                        <FormField
                            control={form.control}
                            name="root_cause.description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}
                </div>

                <Button type="submit" disabled={form.formState.isSubmitting || isPending}>
                    {form.formState.isSubmitting || isPending ? "Saving..." : "Save Investigation"}
                </Button>
            </form>
        </Form>
    )
}