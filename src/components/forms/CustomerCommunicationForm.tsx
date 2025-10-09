"use client"
import { useForm, Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { CustomerCommunicationFormData } from "@/lib/validations/complaint"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, FileText } from "lucide-react"
import { format } from "date-fns"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useUpdateCustomerCommunication } from "@/hooks/api/useComplaints"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useMemo } from "react"
import { useCustomerCommunicationRequirements } from "@/hooks/useComplaintFormRequirements"
import { buildCustomerCommunicationSchema } from "@/lib/validations/complaintSubmission"

export const communicationModes = ["Email", "Call", "Letter", "Other"]

export function CustomerCommunicationForm({
                                              complaintId,
                                              defaultValues,
                                              onSuccess
                                          }: {
    complaintId: string
    defaultValues?: Partial<CustomerCommunicationFormData>
    onSuccess?: () => void
}) {
    const { requirements } = useCustomerCommunicationRequirements()
    const schema = useMemo(() => buildCustomerCommunicationSchema(requirements), [requirements])
    const resolver = useMemo(() => zodResolver(schema) as Resolver<CustomerCommunicationFormData>, [schema])

    const form = useForm<CustomerCommunicationFormData>({
        resolver,
        defaultValues: {
            response_date: new Date(),
            mode: "Email",
            summary: "",
            ...defaultValues
        }
    })

    useEffect(() => {
        form.reset({ ...form.getValues() })
    }, [schema, form])

    const { mutate: updateCommunication, isPending } = useUpdateCustomerCommunication(complaintId)

    const handleSuccess = () => {
        if (onSuccess) {
            onSuccess()
        }
    }

    async function onSubmit(data: CustomerCommunicationFormData) {
        updateCommunication(data, {
            onSuccess: handleSuccess,
        })
    }

    return (
        <Card className="w-full max-w-4xl mx-auto">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Customer Communication Details
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {/* Response Date */}
                        <FormField
                            control={form.control}
                            name="response_date"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Response Date</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant="outline"
                                                    className={cn(
                                                        "w-[240px] pl-3 text-left font-normal",
                                                        !field.value && "text-muted-foreground"
                                                    )}
                                                >
                                                    {field.value ? (
                                                        format(field.value, "PPP")
                                                    ) : (
                                                        <span>Pick a date</span>
                                                    )}
                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={field.value}
                                                onSelect={field.onChange}
                                                disabled={(date) =>
                                                    date > new Date() || date < new Date("1900-01-01")
                                                }
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Communication Mode */}
                        <FormField
                            control={form.control}
                            name="mode"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Communication Mode</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select communication mode" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {communicationModes.map((mode) => (
                                                <SelectItem key={mode} value={mode}>
                                                    {mode}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Communication Summary */}
                        <FormField
                            control={form.control}
                            name="summary"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Communication Summary</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            {...field}
                                            value={field.value ?? ''}
                                            placeholder="Provide a detailed summary of the communication with the customer..."
                                            className="min-h-[120px]"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Submit Button */}
                        <div className="flex justify-end gap-4 pt-6 border-t">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => form.reset()}
                            >
                                Reset Form
                            </Button>
                            <Button
                                type="submit"
                                disabled={form.formState.isSubmitting || isPending}
                                className="min-w-[120px]"
                            >
                                {form.formState.isSubmitting || isPending ? "Saving..." : "Save Communication"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}
