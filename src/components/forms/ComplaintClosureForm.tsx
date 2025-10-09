"use client"
import { Resolver, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ComplaintClosureFormData } from "@/lib/validations/complaint"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useUpdateComplaintClosure } from "@/hooks/api/useComplaints"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useComplaintClosureRequirements } from "@/hooks/useComplaintFormRequirements"
import { buildComplaintClosureSchema } from "@/lib/validations/complaintSubmission"
import { useEffect, useMemo } from "react"
import { FileText, Shield } from "lucide-react"
import { format } from "date-fns"
import { useAuthStore } from "@/stores/authStore"

const isMongoId = (value?: string | null): boolean => !!value && /^[a-f\d]{24}$/i.test(value)

const normalizeRoleLabel = (input: string | undefined) =>
    input
        ? input
            .split(/[-_]/g)
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(" ")
        : undefined

const resolveUserId = (entry: any): string | undefined => {
    if (!entry) return undefined
    if (typeof entry === "string") return entry
    if (entry?._id) return entry._id
    if (entry?.id) return entry.id
    return undefined
}

const buildInvestigatorMap = (investigators: any[] = []) => {
    const map = new Map<string, any>()
    investigators.forEach((inv, index) => {
        const userId = resolveUserId(inv?.user)
        if (!userId) return
        map.set(userId, {
            sr_no: inv?.sr_no ?? index + 1,
            name: typeof inv?.name === "string" ? inv.name : "",
            designation: typeof inv?.designation === "string" ? inv.designation : "",
            signature: typeof inv?.signature === "string" ? inv.signature : "",
        })
    })
    return map
}

const formatUserName = (user: any, fallbackName: string, index: number): string => {
    if (user) {
        const nameParts = [user.firstName, user.lastName].filter((part: string | undefined) => part && part.trim())
        if (nameParts.length) return nameParts.join(" ")
        if (typeof user.fullName === "string" && user.fullName.trim().length) return user.fullName
        if (typeof user.name === "string" && user.name.trim().length) return user.name
        if (typeof user.emailId === "string" && user.emailId.trim().length) return user.emailId
        if (typeof user.email === "string" && user.email.trim().length) return user.email
    }
    if (!fallbackName || isMongoId(fallbackName)) {
        return `Investigator ${index + 1}`
    }
    return fallbackName
}

const formatDesignation = (user: any, fallbackDesignation: string, index: number): string => {
    const userDesignation = normalizeRoleLabel(user?.designation)
    if (userDesignation) return userDesignation

    const role = Array.isArray(user?.role) ? user.role[0] : user?.role
    const normalizedRole = normalizeRoleLabel(role)
    if (normalizedRole) return normalizedRole

    if (fallbackDesignation && !isMongoId(fallbackDesignation)) {
        return fallbackDesignation
    }

    return `Investigation Officer`
}

const resolveSignaturePath = (user: any, fallbackSignature: string): string => {
    const userSignature = user?.signature
    if (userSignature) {
        if (typeof userSignature === "string") return userSignature
        if (typeof userSignature?.path === "string") return userSignature.path
    }
    return fallbackSignature ?? ""
}

export const finalDispositionOptions = [
    "Confirmed Device Defect",
    "No Fault Found",
    "Customer Misuse",
    "Duplicate Complaint",
    "Other"
]

export function ComplaintClosureForm({
                                         complaintId,
                                         defaultValues,
                                         onSuccess,
                                         investigators = [],
                                         assignments = [],
                                     }: {
    complaintId: string
    defaultValues?: Partial<ComplaintClosureFormData>
    onSuccess?: () => void | Promise<void>
    investigators?: Array<any>
    assignments?: Array<any>
}) {
    const { requirements } = useComplaintClosureRequirements()
    const schema = useMemo(() => buildComplaintClosureSchema(requirements), [requirements])
    const resolver = useMemo(() => zodResolver(schema) as Resolver<ComplaintClosureFormData>, [schema])

    const form = useForm<ComplaintClosureFormData>({
        resolver,
        defaultValues: {
            final_disposition: "Customer Misuse",
            final_disposition_other: "",
            reviewed_by: [],
            approved_by: {
                qa_head_name: "",
                signature: "",
                date: undefined
            },
            ...defaultValues
        }
    })

    useEffect(() => {
        form.reset({ ...form.getValues() })
    }, [schema, form])

    const currentUser = useAuthStore((state) => state.user)
    const selectedFinalDisposition = form.watch("final_disposition")

    const investigatorMap = useMemo(() => buildInvestigatorMap(investigators), [investigators])

    const assignmentReviewers = useMemo(() => {
        if (!Array.isArray(assignments) || assignments.length === 0) return [] as any[]

        return assignments
            .map((assignment: any, index: number) => {
                const user = assignment && typeof assignment.user === "object" ? assignment.user : null
                const userId = resolveUserId(assignment?.user) ?? resolveUserId(user)
                const fallback = userId ? investigatorMap.get(userId) : undefined
                const srNo = fallback?.sr_no ?? index + 1
                const fallbackName = fallback?.name ?? ""
                const fallbackDesignation = fallback?.designation ?? ""
                const fallbackSignature = fallback?.signature ?? ""

                const name = formatUserName(user, fallbackName, index)
                const designation = formatDesignation(user, fallbackDesignation, index)
                const signature = resolveSignaturePath(user, fallbackSignature)

                return {
                    sr_no: srNo,
                    name,
                    designation,
                    signature,
                }
            })
            .filter((reviewer: any) => reviewer.name && reviewer.name.trim().length > 0)
    }, [assignments, investigatorMap])

    const fallbackReviewers = useMemo(() => {
        if (assignmentReviewers.length > 0) return assignmentReviewers

        if (investigatorMap.size > 0) {
            return Array.from(investigatorMap.values()).map((inv, index) => ({
                sr_no: inv?.sr_no ?? index + 1,
                name: inv?.name && !isMongoId(inv.name) ? inv.name : `Investigator ${index + 1}`,
                designation: inv?.designation && !isMongoId(inv.designation)
                    ? inv.designation
                    : `Investigation Officer`,
                signature: inv?.signature ?? "",
            }))
        }

        return defaultValues?.reviewed_by ?? []
    }, [assignmentReviewers, investigatorMap, defaultValues?.reviewed_by])

    const derivedReviewers = assignmentReviewers.length ? assignmentReviewers : fallbackReviewers

    const qaHeadName = useMemo(() => {
        if (currentUser) {
            const parts = [currentUser.firstName, currentUser.lastName].filter(Boolean)
            if (parts.length) return parts.join(" ")
            if (currentUser.emailId) return currentUser.emailId
        }
        return defaultValues?.approved_by?.qa_head_name ?? "QA Head"
    }, [currentUser, defaultValues?.approved_by?.qa_head_name])

    const qaSignature = useMemo(() => {
        const userSignature = (currentUser as any)?.signature?.path
        return (userSignature || defaultValues?.approved_by?.signature || "").toString()
    }, [currentUser, defaultValues?.approved_by?.signature])

    useEffect(() => {
        form.setValue("reviewed_by", derivedReviewers, { shouldValidate: false })
    }, [form, derivedReviewers])

    useEffect(() => {
        form.setValue("approved_by.qa_head_name", qaHeadName, { shouldValidate: false })
        form.setValue("approved_by.signature", qaSignature, { shouldValidate: false })
    }, [form, qaHeadName, qaSignature])

    useEffect(() => {
        const existingDate = defaultValues?.approved_by?.date
        const fallbackDate = existingDate ? new Date(existingDate) : new Date()
        form.setValue("approved_by.date", fallbackDate, { shouldValidate: false })
    }, [form, defaultValues?.approved_by?.date])

    const approvalDateValue = form.watch("approved_by.date")
    const approvalDisplayDate = useMemo(() => {
        const dateValue = approvalDateValue instanceof Date ? approvalDateValue : approvalDateValue ? new Date(approvalDateValue) : null
        if (!dateValue || Number.isNaN(dateValue.getTime())) return format(new Date(), "PPP")
        return format(dateValue, "PPP")
    }, [approvalDateValue])

    const { mutate: updateClosure, isPending } = useUpdateComplaintClosure(complaintId)

    async function onSubmit(data: ComplaintClosureFormData) {
        const submissionDate = new Date()
        form.setValue("approved_by.date", submissionDate, { shouldValidate: false })
        const payload: ComplaintClosureFormData = {
            ...data,
            reviewed_by: derivedReviewers,
            approved_by: {
                qa_head_name: qaHeadName,
                signature: qaSignature,
                date: submissionDate,
            },
        }

        updateClosure(payload, {
            onSuccess: async () => {
                if (onSuccess) {
                    await onSuccess()
                }
            }
        })
    }

    return (
        <div className="w-full max-w-6xl mx-auto space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg font-semibold">Complaint Closure Details</CardTitle>
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
                                    {selectedFinalDisposition === "Other" && (
                                        <FormField
                                            control={form.control}
                                            name="final_disposition_other"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Other Final Disposition Details *</FormLabel>
                                                    <FormControl>
                                                        <Textarea
                                                            {...field}
                                                            value={field.value ?? ''}
                                                            placeholder="Provide additional details for the selected disposition"
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    )}
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
                                <CardContent className="space-y-3 text-sm">
                                    <div>
                                    <FormLabel className="text-xs uppercase text-muted-foreground">QA Head Name</FormLabel>
                                    <p className="font-medium">{qaHeadName}</p>
                                    </div>
                                    <div>
                                        <FormLabel className="text-xs uppercase text-muted-foreground">Approval Date</FormLabel>
                                        <p className="font-medium">{approvalDisplayDate}</p>
                                    </div>
                                    <div>
                                        <FormLabel className="text-xs uppercase text-muted-foreground">Digital Signature</FormLabel>
                                        <p className="text-xs text-muted-foreground">
                                            Stored automatically and included in the PDF report.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Closure Guidelines */}
                            <Alert>
                                <AlertDescription>
                                    <strong>Closure Checklist:</strong> Ensure all investigation activities are complete, customer communication is finalized,
                                    CAPA actions are initiated (if required), and all required approvals are obtained before closing the complaint.
                                </AlertDescription>
                            </Alert>

                            <Separator />

                            {/* Submit Section */}
                            <div className="flex justify-end gap-4 pt-6">
                                {/* <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => form.reset()}
                                >
                                    Reset Form
                                </Button> */}
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
//     final_disposition_other: z.string().optional()
// })
//
// export type ComplaintClosureFormData = z.infer<typeof complaintClosureSchema>
