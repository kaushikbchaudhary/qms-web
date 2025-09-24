"use client"
import { useEffect, useMemo } from 'react'
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { investigationSchema, InvestigationFormData } from "@/lib/validations/complaint"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Textarea} from "@/components/ui/textarea";
import {useSignatureUpload, useUpdateInvestigation} from "@/hooks/api/useComplaints";
import { InvestigationAssignment } from "@/lib/api/types/complaints";
import {SignaturePreviewModal} from "@/components/forms/SignaturePreviewModal";
import {Switch} from "@/components/ui/switch";
import {cn} from "@/lib/utils";
export const root_cause= ["Device Failure", "Manufacturing Issue", "Labeling/IFU", "Customer Misuse", "No Fault Found"];
export function InvestigationForm({
                                      complaintId,
                                      defaultValues,
                                      onSuccess,
                                      assignments = []
                                  }: {
    complaintId: string
    defaultValues?: Partial<InvestigationFormData>
    onSuccess: () => void
    assignments?: InvestigationAssignment[]
}) {
    const form = useForm<InvestigationFormData>({
        resolver: zodResolver(investigationSchema),
        defaultValues
    })

    const { mutate, isPending } = useUpdateInvestigation(complaintId);

    async function onSubmit(data: InvestigationFormData) {
        mutate(data);
    }

    const { mutateAsync: uploadInvestigationAsset } = useSignatureUpload();

    const derivedOfficers = useMemo(() => {
        if (assignments && assignments.length > 0) {
            return assignments
                .map((assignment, index) => {
                    const user = assignment.user as any;
                    if (!user) return null;
                    const nameParts = [user.firstName, user.middleName, user.lastName]
                        .filter((part: string | undefined) => typeof part === 'string' && part.trim().length > 0);
                    const fullName = nameParts.length ? nameParts.join(' ') : user.emailId ?? user._id ?? '';
                    if (!fullName) return null;

                    const primaryRole = Array.isArray(user.role) && user.role.length ? user.role[0] : undefined;
                    const designation = primaryRole
                        ? primaryRole.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
                        : user.organization ?? 'Investigation Officer';

                    return {
                        sr_no: index + 1,
                        name: fullName,
                        designation,
                        signature: user?.signature?.path ?? '',
                    };
                })
                .filter((entry): entry is { sr_no: number; name: string; designation: string; signature: string } => entry !== null);
        }

        return (defaultValues?.investigating_officers as any[]) ?? [];
    }, [assignments, defaultValues?.investigating_officers]);

    useEffect(() => {
        if (derivedOfficers) {
            form.setValue('investigating_officers', derivedOfficers as any, { shouldDirty: false });
        }
    }, [form, derivedOfficers]);

    const investigatingOfficers = form.watch('investigating_officers') ?? [];

    const handleCompletionSignatureUpload = async (file: File) => {
        try {
            const imageUrl = await uploadInvestigationAsset(file);
            form.setValue('completion_details.signature', imageUrl.path, { shouldDirty: true });
        } catch (error) {
            console.error("Error uploading signature:", error);
        }
    };
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
                    <div className="flex flex-col gap-1">
                        <h3 className="font-medium">Investigating Officers</h3>
                        <p className="text-sm text-muted-foreground">
                            Investigators are automatically listed based on complaint assignments. Update their signature from the user profile if needed.
                        </p>
                    </div>

                    <div className="space-y-3">
                        {investigatingOfficers.length === 0 ? (
                            <p className="text-sm text-muted-foreground border border-dashed rounded-md p-4">
                                No investigators assigned yet. Assign team members to this complaint to populate their details here.
                            </p>
                        ) : (
                            investigatingOfficers.map((officer: any) => (
                                <div
                                    key={officer.sr_no}
                                    className="border rounded-md p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
                                >
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium">Officer #{officer.sr_no}</p>
                                        <p className="text-base">{officer.name}</p>
                                        <p className="text-sm text-muted-foreground">{officer.designation}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {officer.signature ? (
                                            <SignaturePreviewModal
                                                signaturePath={officer.signature}
                                                triggerText="View Signature"
                                                source="user"
                                            />
                                        ) : (
                                            <span className="text-sm text-muted-foreground">No signature uploaded</span>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
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

                {/* Corrective Action Section */}
                <div className="space-y-4">
                    <h3 className="font-medium">Corrective Action</h3>
                    <FormField
                        control={form.control}
                        name="corrective_action"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                    <Textarea
                                        {...field}
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
                                    <FormLabel className="text-base">CAPA Initiated</FormLabel>
                                </div>
                                <FormControl>
                                    <Switch
                                        checked={field.value}
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
                    <h3 className="font-medium">Action Taken</h3>
                    <FormField
                        control={form.control}
                        name="action_taken"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                    <Textarea
                                        {...field}
                                        placeholder="Describe the action taken"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Completion Details Section */}
                <div className="space-y-4">
                    <h3 className="font-medium">Completion Details</h3>
                    <FormField
                        control={form.control}
                        name="completion_details.name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Completed By</FormLabel>
                                <FormControl>
                                    <Input
                                        {...field}
                                        placeholder="Enter name of person completing"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="completion_details.signature"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Signature</FormLabel>
                                <FormControl>
                                    <div>
                                        {field.value && (
                                            <SignaturePreviewModal signaturePath={field.value} />
                                        )}
                                        <Input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    handleCompletionSignatureUpload(file);
                                                }
                                            }}
                                        />
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="completion_details.date"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Completion Date</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant={"outline"}
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
                </div>


                <Button type="submit" disabled={form.formState.isSubmitting || isPending}>
                    {form.formState.isSubmitting || isPending ? "Saving..." : "Save Investigation"}
                </Button>
            </form>
        </Form>
    )
}
