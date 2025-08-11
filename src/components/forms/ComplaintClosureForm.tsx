"use client"
import { useFieldArray, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { complaintClosureSchema, ComplaintClosureFormData } from "@/lib/validations/complaint"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Plus, Trash2, FileText, Eye, CheckCircle, UserCheck, Shield } from "lucide-react"
import { format } from "date-fns"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useAttachmentDelete, useSignatureUpload, useUpdateComplaintClosure } from "@/hooks/api/useComplaints"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SignaturePreviewModal } from "@/components/forms/SignaturePreviewModal"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"

export const finalDispositionOptions = [
    "Confirmed Device Defect",
    "No Fault Found",
    "Customer Misuse",
    "Duplicate",
    "Other"
]

export function ComplaintClosureForm({
                                         complaintId,
                                         defaultValues,
                                         onSuccess
                                     }: {
    complaintId: string
    defaultValues?: Partial<ComplaintClosureFormData>
    onSuccess: () => void
}) {
    const form = useForm<ComplaintClosureFormData>({
        resolver: zodResolver(complaintClosureSchema),
        defaultValues: {
            final_disposition: "Customer Misuse",
            reviewed_by: [],
            approved_by: {
                qa_head_name: "",
                signature: "",
                date: undefined
            },
            closure_comments: "",
            ...defaultValues
        }
    })

    const { fields: reviewerFields, append: appendReviewer, remove: removeReviewer } = useFieldArray({
        control: form.control,
        name: "reviewed_by"
    })

    const { mutate: updateClosure, isPending } = useUpdateComplaintClosure(complaintId)
    const { mutateAsync: uploadSignature, isPending: isUploadingSignature } = useSignatureUpload()
    const { mutate: deleteSignature } = useAttachmentDelete()

    async function onSubmit(data: ComplaintClosureFormData) {
        console.log("Complaint Closure Data:", data)
        updateClosure(data, {
            onSuccess: () => {
                onSuccess()
            }
        })
    }

    const handleReviewerSignatureUpload = async (file: File, index: number) => {
        try {
            const uploadResult = await uploadSignature(file)
            console.log("Reviewer signature uploaded successfully:", uploadResult)
            form.setValue(`reviewed_by.${index}.signature`, uploadResult.path)
        } catch (error) {
            console.error("Error uploading reviewer signature:", error)
        }
    }

    const handleApproverSignatureUpload = async (file: File) => {
        try {
            const uploadResult = await uploadSignature(file)
            console.log("Approver signature uploaded successfully:", uploadResult)
            form.setValue("approved_by.signature", uploadResult.path)
        } catch (error) {
            console.error("Error uploading approver signature:", error)
        }
    }

    const handleReviewerRemove = async (index: number) => {
        const signature = form.getValues(`reviewed_by.${index}.signature`)
        if (signature) {
            try {
                await deleteSignature(signature)
            } catch (e) {
                console.warn("Reviewer signature deletion failed", e)
            }
        }
        removeReviewer(index)
    }

    const addNewReviewer = () => {
        appendReviewer({
            sr_no: reviewerFields.length + 1,
            name: "",
            designation: "",
            signature: ""
        })
    }

    return (
        <div className="w-full max-w-6xl mx-auto space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5" />
                        Complaint Closure Details
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                            {/* Final Disposition Section */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <FileText className="h-4 w-4" />
                                        Final Disposition
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="final_disposition"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Final Disposition *</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select final disposition" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {finalDispositionOptions.map((option) => (
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
                                </CardContent>
                            </Card>

                            {/* Reviewed By Section */}
                            <Card>
                                <CardHeader>
                                    <div className="flex justify-between items-center">
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <UserCheck className="h-4 w-4" />
                                            Reviewed By
                                        </CardTitle>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={addNewReviewer}
                                            className="flex items-center gap-2"
                                        >
                                            <Plus className="h-4 w-4" />
                                            Add Reviewer
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {reviewerFields.length === 0 && (
                                        <Alert>
                                            <UserCheck className="h-4 w-4" />
                                            <AlertDescription>
                                                No reviewers added yet. Click "Add Reviewer" to add complaint reviewers.
                                            </AlertDescription>
                                        </Alert>
                                    )}

                                    {reviewerFields.map((field, index) => (
                                        <Card key={field.id} className="border-l-4 border-l-blue-500">
                                            <CardContent className="pt-4">
                                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                    {/* Serial Number */}
                                                    <FormField
                                                        control={form.control}
                                                        name={`reviewed_by.${index}.sr_no`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Sr. No</FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        type="number"
                                                                        {...field}
                                                                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    {/* Name */}
                                                    <FormField
                                                        control={form.control}
                                                        name={`reviewed_by.${index}.name`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Reviewer Name *</FormLabel>
                                                                <FormControl>
                                                                    <Input {...field} placeholder="Enter reviewer name" />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    {/* Designation */}
                                                    <FormField
                                                        control={form.control}
                                                        name={`reviewed_by.${index}.designation`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Designation *</FormLabel>
                                                                <FormControl>
                                                                    <Input {...field} placeholder="Enter designation" />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    {/* Signature */}
                                                    <FormField
                                                        control={form.control}
                                                        name={`reviewed_by.${index}.signature`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Digital Signature</FormLabel>
                                                                <FormControl>
                                                                    <div className="space-y-2">
                                                                        {field.value && (
                                                                            <div className="flex items-center gap-2">
                                                                                <SignaturePreviewModal signaturePath={field.value} />
                                                                                <Badge variant="secondary" className="text-xs">
                                                                                    Signed
                                                                                </Badge>
                                                                            </div>
                                                                        )}
                                                                        <Input
                                                                            type="file"
                                                                            accept="image/*"
                                                                            onChange={(e) => {
                                                                                const file = e.target.files?.[0]
                                                                                if (file) {
                                                                                    handleReviewerSignatureUpload(file, index)
                                                                                }
                                                                            }}
                                                                            className="text-sm"
                                                                        />
                                                                    </div>
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>

                                                <div className="flex justify-end mt-4">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleReviewerRemove(index)}
                                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-1" />
                                                        Remove Reviewer
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </CardContent>
                            </Card>

                            {/* Approved By Section */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Shield className="h-4 w-4" />
                                        QA Head Approval
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* QA Head Name */}
                                        <FormField
                                            control={form.control}
                                            name="approved_by.qa_head_name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>QA Head Name *</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} placeholder="Enter QA Head name" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        {/* Approval Date */}
                                        <FormField
                                            control={form.control}
                                            name="approved_by.date"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-col">
                                                    <FormLabel>Approval Date *</FormLabel>
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <FormControl>
                                                                <Button
                                                                    variant="outline"
                                                                    className={cn(
                                                                        "pl-3 text-left font-normal",
                                                                        !field.value && "text-muted-foreground"
                                                                    )}
                                                                >
                                                                    {field.value ? (
                                                                        format(field.value, "PPP")
                                                                    ) : (
                                                                        <span>Pick approval date</span>
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
                                    </div>

                                    {/* QA Head Signature */}
                                    <FormField
                                        control={form.control}
                                        name="approved_by.signature"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>QA Head Digital Signature *</FormLabel>
                                                <FormControl>
                                                    <div className="space-y-3">
                                                        {field.value && (
                                                            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-md border border-green-200">
                                                                <CheckCircle className="h-4 w-4 text-green-600" />
                                                                <span className="text-sm text-green-800">QA Head signature uploaded</span>
                                                                <SignaturePreviewModal signaturePath={field.value} />
                                                            </div>
                                                        )}
                                                        <Input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={(e) => {
                                                                const file = e.target.files?.[0]
                                                                if (file) {
                                                                    handleApproverSignatureUpload(file)
                                                                }
                                                            }}
                                                            className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                                        />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>

                            {/* Closure Comments Section */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <FileText className="h-4 w-4" />
                                        Closure Comments
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <FormField
                                        control={form.control}
                                        name="closure_comments"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Final Closure Comments</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        {...field}
                                                        placeholder="Provide final comments regarding the complaint closure, lessons learned, and any recommendations for future prevention..."
                                                        className="min-h-[120px]"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>

                            {/* Closure Guidelines */}
                            <Alert>
                                <CheckCircle className="h-4 w-4" />
                                <AlertDescription>
                                    <strong>Closure Checklist:</strong> Ensure all investigation activities are complete, customer communication is finalized,
                                    CAPA actions are initiated (if required), and all required approvals are obtained before closing the complaint.
                                </AlertDescription>
                            </Alert>

                            <Separator />

                            {/* Submit Section */}
                            <div className="flex justify-end gap-4 pt-6">
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
                                    className="min-w-[140px] bg-green-600 hover:bg-green-700"
                                >
                                    {form.formState.isSubmitting || isPending ? "Closing..." : "Close Complaint"}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    )
}

// Validation Schema - Add this to your @/lib/validations/complaint.ts file

// import { z } from "zod"
//
// export const complaintClosureSchema = z.object({
//     final_disposition: z.enum([
//         "Confirmed Device Defect",
//         "No Fault Found",
//         "Customer Misuse",
//         "Duplicate",
//         "Other"
//     ], {
//         required_error: "Final disposition is required"
//     }),
//     reviewed_by: z.array(z.object({
//         sr_no: z.number().min(1, "Serial number is required"),
//         name: z.string().min(2, "Reviewer name is required"),
//         designation: z.string().min(2, "Designation is required"),
//         signature: z.string().optional()
//     })).min(1, "At least one reviewer is required"),
//     approved_by: z.object({
//         qa_head_name: z.string().min(2, "QA Head name is required"),
//         signature: z.string().min(1, "QA Head signature is required"),
//         date: z.date({
//             required_error: "Approval date is required"
//         })
//     }),
//     closure_comments: z.string().optional()
// })
//
// export type ComplaintClosureFormData = z.infer<typeof complaintClosureSchema>