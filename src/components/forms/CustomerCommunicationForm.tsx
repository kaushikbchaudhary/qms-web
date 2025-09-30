"use client"
import { FieldArrayPath, useFieldArray, useForm, Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { CustomerCommunicationFormData } from "@/lib/validations/complaint"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Plus, Trash2, FileText, Eye } from "lucide-react"
import { format } from "date-fns"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useAttachmentDelete, useAttachmentUpload, useUpdateCustomerCommunication } from "@/hooks/api/useComplaints"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
    console.log("Customer Communication Form Rendered")

    const { requirements } = useCustomerCommunicationRequirements()
    const schema = useMemo(() => buildCustomerCommunicationSchema(requirements), [requirements])
    const resolver = useMemo(() => zodResolver(schema) as Resolver<CustomerCommunicationFormData>, [schema])

    const form = useForm<CustomerCommunicationFormData>({
        resolver,
        defaultValues: {
            response_date: new Date(),
            mode: "Email",
            summary: "",
            attachments: [],
            ...defaultValues
        }
    })

    useEffect(() => {
        form.reset({ ...form.getValues() })
    }, [schema, form])

    const { fields: attachmentFields, append: appendAttachment, remove: removeAttachment } = useFieldArray<CustomerCommunicationFormData>({
        control: form.control,
        name: "attachments" as FieldArrayPath<CustomerCommunicationFormData>
    })

    const { mutate: updateCommunication, isPending } = useUpdateCustomerCommunication(complaintId)
    const { mutateAsync: uploadAttachment, isPending: isUploadingAttachment } = useAttachmentUpload()
    const { mutate: deleteAttachment } = useAttachmentDelete()

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

    const handleFileUpload = async (file: File, index: number) => {
        try {
            const uploadResult = await uploadAttachment(file)
            // Update the specific attachment field
            form.setValue(`attachments.${index}`, uploadResult.path)
        } catch (error) {
            console.error("Error uploading file:", error)
        }
    }

    const handleAttachmentRemove = async (index: number) => {
        const attachment = form.getValues(`attachments.${index}`)
        if (attachment) {
            try {
                await deleteAttachment(attachment)
            } catch (e) {
                console.warn("Attachment deletion failed", e)
            }
        }
        removeAttachment(index)
    }

    const addNewAttachment = () => {
        appendAttachment("")
    }

    const getFileName = (path: string) => {
        return path.split('/').pop() || path
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

                        {/* Attachments Section */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="font-medium text-lg">Communication Attachments</h3>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={addNewAttachment}
                                    className="flex items-center gap-2"
                                >
                                    <Plus className="h-4 w-4" />
                                    Add Attachment
                                </Button>
                            </div>

                            {attachmentFields.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>No attachments added yet</p>
                                    <p className="text-sm">Click "Add Attachment" to upload documents</p>
                                </div>
                            )}

                            {attachmentFields.map((field, index) => (
                                <Card key={field.id} className="p-4">
                                    <div className="flex items-center gap-4">
                                        <div className="flex-1">
                                            <FormField
                                                control={form.control}
                                                name={`attachments.${index}`}
                                                render={({ field: attachmentField }) => (
                                                    <FormItem>
                                                        <FormLabel>Attachment {index + 1}</FormLabel>
                                                        <FormControl>
                                                            <div className="space-y-2">
                                                                {attachmentField.value ? (
                                                                    <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                                                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                                                        <span className="text-sm flex-1">
                                                                            {getFileName(attachmentField.value)}
                                                                        </span>
                                                                        <Badge variant="secondary" className="text-xs">
                                                                            Uploaded
                                                                        </Badge>
                                                                        <Button
                                                                            type="button"
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            className="h-6 w-6 p-0"
                                                                        >
                                                                            <Eye className="h-3 w-3" />
                                                                        </Button>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex items-center gap-2">
                                                                        <Input
                                                                            type="file"
                                                                            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                                                                            onChange={(e) => {
                                                                                const file = e.target.files?.[0]
                                                                                if (file) {
                                                                                    handleFileUpload(file, index)
                                                                                }
                                                                            }}
                                                                            className="flex-1"
                                                                        />
                                                                        {isUploadingAttachment && (
                                                                            <Badge variant="secondary" className="text-xs">
                                                                                Uploading...
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleAttachmentRemove(index)}
                                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                        </div>

                        {/* Additional Communication Notes */}
                        <div className="bg-muted/50 p-4 rounded-lg">
                            <h4 className="font-medium mb-2">Communication Guidelines</h4>
                            <ul className="text-sm text-muted-foreground space-y-1">
                                <li>• Ensure all customer communications are professional and empathetic</li>
                                <li>• Include relevant technical details while keeping language accessible</li>
                                <li>• Attach supporting documents such as test reports, photos, or technical drawings</li>
                                <li>• Document follow-up actions and timelines clearly</li>
                            </ul>
                        </div>

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
