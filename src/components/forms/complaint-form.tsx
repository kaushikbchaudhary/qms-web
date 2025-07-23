'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon } from '@radix-ui/react-icons'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import {useAttachmentUpload, useComplaints, useCreateComplaint} from '@/hooks/api/useComplaints'
import { toast } from 'sonner'
import {useMemo} from "react";
import {Complaint} from "@/lib/api/types/complaints";
import {RefinementCtx} from "zod";
import FileUploadComponent from "@/components/shared/FileUploadComponent";
import {complaintsApi} from "@/lib/api/endpoints/complaints";

// Form validation schema
const formSchema = z.object({
    customer: z.object({
        name: z.string().min(2, "Name must be at least 2 characters"),
        company: z.string().optional(),
        contact_number: z.string().min(10, "Invalid phone number"),
        email: z.string().email("Invalid email address"),
    }),
    product_details: z.object({
        model: z.string().min(1, "Model is required"),
        serial_number: z.string().min(1, "Serial number is required"),
        purchase_date: z.string(),
    }),
    // complaint_type: z.object({
    //     name: z.string(),
    //     description: z.string().nullable(),
    //     config: z.object({
    //         _id: z.string(),
    //         name: z.string(),
    //         type: z.string(),
    //     }),
    // }),
    complaint_type: z.object({
        name: z.string(),
        description: z.string().superRefine((val, ctx:any) => {
            // Only validate if parent has isOther (added temporarily)
            if (ctx.parent?.isOther && !val) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Please specify your complaint type",
                });
            }
        }),
        config: z.object({
            _id: z.string(),
            name: z.string(),
            type: z.string(),
        }),
        // Temporary field for UI logic (won't be submitted)
        isOther: z.boolean().optional()
    }),
    issue_details: z.object({
        description: z.string().min(10, "Description must be at least 10 characters"),
        problem_start_date: z.string(),
        occurred_before: z.enum(["Yes", "No"]),
        replication_steps: z.string().optional(),
    }),
    customer_impact: z.string().min(10, "Impact description must be at least 10 characters"),
    previous_contact: z.object({
        reported_before: z.enum(["Yes", "No"]),
        reference_number: z.string().optional(),
        contact_date: z.string().optional(),
        person_contacted: z.string().optional(),
    }),
    customer_actions: z.object({
        troubleshooting_done: z.enum(["Yes", "No"]),
        troubleshooting_description: z.string().optional(),
    }),
    preferred_resolution_method: z.object({
        name: z.string(),
        description: z.string().nullable(),
        config: z.object({
            _id: z.string(),
            name: z.string(),
            type: z.string(),
        }),
    }),
    replacement_details: z.object({
        batch_number: z.string().optional(),
        serial_number: z.string().optional(),
        mfg_date: z.string().optional(),
    }).optional(),
    attachments: z.array(z.string().url("Invalid URL")).optional(),
})

export function ComplaintForm() {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            customer: {
                name: "",
                company: "",
                contact_number: "",
                email: "",
            },
            product_details: {
                model: "",
                serial_number: "",
                purchase_date: new Date().toISOString(),
            },
            complaint_type: {
                name: "Performance Issue",
                description: "Issues related to product performance",
                config: {
                    _id: "687dc9f1b0e9176a170ac0bc",
                    name: "Performance Issue",
                    type: "COMPLAINT_TYPE",
                },
                isOther: false
            },
            issue_details: {
                description: "",
                problem_start_date: new Date().toISOString(),
                occurred_before: "No",
                replication_steps: "",
            },
            customer_impact: "",
            previous_contact: {
                reported_before: "No",
                reference_number: "",
                contact_date: "",
                person_contacted: "",
            },
            customer_actions: {
                troubleshooting_done: "No",
                troubleshooting_description: "",
            },
            preferred_resolution_method: {
                name: "Replacement",
                description: "Replacement of the faulty product",
                config: {
                    _id: "687dc9f1b0e9176a170ac0c2",
                    name: "Replacement",
                    type: "RESOLUTION_METHOD",
                },
            },
            replacement_details:{
                batch_number: "",
                serial_number: "",
                mfg_date: '',
            },
            attachments: [],
        },
    })

    const { mutate: createComplaint, isPending } = useCreateComplaint()

    const onSubmit = (values: z.infer<typeof formSchema>) => {
        console.log('Submitting complaint with values:', values)
        // Remove the temporary isOther field before submission
        const { isOther, ...complaintType } = values.complaint_type;
        const payload = {
            ...values,
            issue_details: {
                ...values.issue_details,
                replication_steps: values.issue_details.replication_steps ?? null,
            },
            complaint_type: {
                ...complaintType,
                // If "Other" was selected, use description as name
                name: isOther ? values.complaint_type.description : complaintType.name
            },
            replacement_details:{
                ...values.replacement_details,
                ...(values.replacement_details ? {
                    batch_number: values.replacement_details.batch_number || undefined,
                    serial_number: values.replacement_details.serial_number || undefined,
                    mfg_date: values.replacement_details.mfg_date ? new Date(values.replacement_details.mfg_date).toISOString() : undefined,
                } : {})
            },
            attachments: values.attachments,
        }
        createComplaint(payload, {
            onSuccess: () => {
                toast.success("Complaint created successfully")
                form.reset()
            },
            onError: (error) => {
                toast.error(error.message)
            }
        })
    }

    const {refetch:complaintTypesFetch,isFetching,isLoading,data} = useComplaints({ type: 'COMPLAINT_TYPE' }) // Example usage of useComplaints hook

    useMemo(()=>{
        complaintTypesFetch();
    },[])

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {/* Customer Section */}
                <div className="space-y-4 p-6 border rounded-lg">
                    <h3 className="font-medium">Customer Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="customer.name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Full Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Adam Weins" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="customer.company"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Company</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Weins Sports LLP." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="customer.contact_number"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Contact Number</FormLabel>
                                    <FormControl>
                                        <Input placeholder="+91 7985453241" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="customer.email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input placeholder="adam@gmail.com" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                {/* Product Details Section */}
                <div className="space-y-4 p-6 border rounded-lg">
                    <h3 className="font-medium">Product Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="product_details.model"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Model</FormLabel>
                                    <FormControl>
                                        <Input placeholder="OOM_800" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="product_details.serial_number"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Serial Number</FormLabel>
                                    <FormControl>
                                        <Input placeholder="KE304062400001" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="product_details.purchase_date"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Purchase Date</FormLabel>
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
                                                        format(new Date(field.value), "PPP")
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
                                                selected={new Date(field.value)}
                                                onSelect={(date) =>
                                                    field.onChange(date?.toISOString())
                                                }
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
                </div>

                {/* Complaint Type Section */}
                <div className="space-y-4 p-6 border rounded-lg">
                    <h3 className="font-medium">Complaint Type</h3>

                    <FormField
                        control={form.control}
                        name="complaint_type"
                        render={({ field }) => (
                            <FormItem className="space-y-3">
                                <FormLabel>Select Complaint Type</FormLabel>
                                <FormControl>
                                    <RadioGroup
                                        onValueChange={(value) => {
                                            console.log('Selected complaint type ID:', value)
                                            const selected  = data && data.find((item:Complaint) => item._id === value);
                                            console.log('Selected complaint type:', selected)
                                            if (selected) {
                                                const isOther = selected.name.toLowerCase() === "other";
                                                console.log('Is Other:', isOther)
                                                form.setValue("complaint_type", {
                                                    name: selected.name,
                                                    description: isOther ? "" : selected?.description || "",
                                                    config: {
                                                        _id: selected._id,
                                                        name: selected.name,
                                                        type: selected.type
                                                    },
                                                    isOther // We'll add this temporary field for UI logic
                                                });
                                            }
                                        }}
                                        value={field.value?.config?._id}
                                        className="flex flex-col space-y-2"
                                    >
                                        {data && data.map((type:Complaint) => (
                                            <FormItem key={type._id} className="flex items-center space-x-3 space-y-0">
                                                <FormControl>
                                                    <RadioGroupItem value={type._id} />
                                                </FormControl>
                                                <FormLabel className="font-normal">
                                                    {type.name}
                                                </FormLabel>
                                            </FormItem>
                                        ))}
                                    </RadioGroup>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Show only when "Other" is selected */}
                    {/*{(data && data.find(item => item._id === form.watch("complaint_type.config._id"))?.name.toLowerCase() === "other") && (*/}
                    {/*    <FormField*/}
                    {/*        control={form.control}*/}
                    {/*        name="complaint_type.description"*/}
                    {/*        render={({ field }) => (*/}
                    {/*            <FormItem>*/}
                    {/*                <FormLabel className="text-foreground">Please specify*</FormLabel>*/}
                    {/*                <FormControl>*/}
                    {/*                    <Input*/}
                    {/*                        placeholder="Describe your specific complaint type..."*/}
                    {/*                        {...field}*/}
                    {/*                        className="mt-1"*/}
                    {/*                    />*/}
                    {/*                </FormControl>*/}
                    {/*                <FormMessage />*/}
                    {/*            </FormItem>*/}
                    {/*        )}*/}
                    {/*    />*/}
                    {/*)}*/}

                    {/* Regular description for non-"Other" types */}
                    {!form.watch("complaint_type.isOther") && form.watch("complaint_type.config._id") ? (
                        <FormField
                            control={form.control}
                            name="complaint_type.description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Provide details about the issue..."
                                            className="min-h-[80px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    ):(
                        <FormField
                            control={form.control}
                            name="complaint_type.description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-foreground">Please specify*</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Describe your specific complaint type..."
                                            {...field}
                                            className="mt-1"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}
                </div>
                {/* Issue Details Section */}
                <div className="space-y-4 p-6 border rounded-lg">
                    <h3 className="font-medium">Issue Details</h3>
                    <FormField
                        control={form.control}
                        name="issue_details.description"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="This is demo description"
                                        className="min-h-[120px]"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="issue_details.problem_start_date"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Problem Start Date</FormLabel>
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
                                                        format(new Date(field.value), "PPP")
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
                                                selected={new Date(field.value)}
                                                onSelect={(date) =>
                                                    field.onChange(date?.toISOString())
                                                }
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
                        <FormField
                            control={form.control}
                            name="issue_details.occurred_before"
                            render={({ field }) => (
                                <FormItem className="space-y-3">
                                    <FormLabel>Has this issue occurred before?</FormLabel>
                                    <FormControl>
                                        <RadioGroup
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            className="flex space-x-4"
                                        >
                                            <FormItem className="flex items-center space-x-2 space-y-0">
                                                <FormControl>
                                                    <RadioGroupItem value="Yes" />
                                                </FormControl>
                                                <FormLabel className="font-normal">Yes</FormLabel>
                                            </FormItem>
                                            <FormItem className="flex items-center space-x-2 space-y-0">
                                                <FormControl>
                                                    <RadioGroupItem value="No" />
                                                </FormControl>
                                                <FormLabel className="font-normal">No</FormLabel>
                                            </FormItem>
                                        </RadioGroup>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    {form.watch("issue_details.occurred_before") === "Yes" && (
                        <FormField
                            control={form.control}
                            name="issue_details.replication_steps"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Replication Steps</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Steps to reproduce the issue..."
                                            className="min-h-[80px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}
                </div>

                {/* Customer Impact Section */}
                <div className="space-y-4 p-6 border rounded-lg">
                    <h3 className="font-medium">Customer Impact</h3>
                    <FormField
                        control={form.control}
                        name="customer_impact"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>How is this issue affecting you?</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="This is demo impact."
                                        className="min-h-[100px]"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Previous Contact Section */}
                <div className="space-y-4 p-6 border rounded-lg">
                    <h3 className="font-medium">Previous Contact</h3>
                    <FormField
                        control={form.control}
                        name="previous_contact.reported_before"
                        render={({ field }) => (
                            <FormItem className="space-y-3">
                                <FormLabel>Have you reported this issue before?</FormLabel>
                                <FormControl>
                                    <RadioGroup
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        className="flex space-x-4"
                                    >
                                        <FormItem className="flex items-center space-x-2 space-y-0">
                                            <FormControl>
                                                <RadioGroupItem value="Yes" />
                                            </FormControl>
                                            <FormLabel className="font-normal">Yes</FormLabel>
                                        </FormItem>
                                        <FormItem className="flex items-center space-x-2 space-y-0">
                                            <FormControl>
                                                <RadioGroupItem value="No" />
                                            </FormControl>
                                            <FormLabel className="font-normal">No</FormLabel>
                                        </FormItem>
                                    </RadioGroup>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    {form.watch("previous_contact.reported_before") === "Yes" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="previous_contact.reference_number"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Reference Number</FormLabel>
                                        <FormControl>
                                            <Input placeholder="#7637167826" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="previous_contact.contact_date"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Contact Date</FormLabel>
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
                                                            format(new Date(field.value), "PPP")
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
                                                    selected={field.value ? new Date(field.value) : undefined}
                                                    onSelect={(date) =>
                                                        field.onChange(date?.toISOString())
                                                    }
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
                            <FormField
                                control={form.control}
                                name="previous_contact.person_contacted"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Person Contacted</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Kate Pierson" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    )}
                </div>

                {/* Customer Actions Section */}
                <div className="space-y-4 p-6 border rounded-lg">
                    <h3 className="font-medium">Customer Actions</h3>
                    <FormField
                        control={form.control}
                        name="customer_actions.troubleshooting_done"
                        render={({ field }) => (
                            <FormItem className="space-y-3">
                                <FormLabel>Have you attempted any troubleshooting steps?</FormLabel>
                                <FormControl>
                                    <RadioGroup
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        className="flex space-x-4"
                                    >
                                        <FormItem className="flex items-center space-x-2 space-y-0">
                                            <FormControl>
                                                <RadioGroupItem value="Yes" />
                                            </FormControl>
                                            <FormLabel className="font-normal">Yes</FormLabel>
                                        </FormItem>
                                        <FormItem className="flex items-center space-x-2 space-y-0">
                                            <FormControl>
                                                <RadioGroupItem value="No" />
                                            </FormControl>
                                            <FormLabel className="font-normal">No</FormLabel>
                                        </FormItem>
                                    </RadioGroup>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    {form.watch("customer_actions.troubleshooting_done") === "Yes" && (
                        <FormField
                            control={form.control}
                            name="customer_actions.troubleshooting_description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Troubleshooting Steps Taken</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="We tried tossing the ECG patch on, but it didn't work."
                                            className="min-h-[80px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}
                </div>

                {/* Preferred Resolution Section */}
                <div className="space-y-4 p-6 border rounded-lg">
                    <h3 className="font-medium">Preferred Resolution Method</h3>
                    <FormField
                        control={form.control}
                        name="preferred_resolution_method.name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Resolution Method</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="Replacement"
                                        {...field}
                                        readOnly // Assuming this is selected from a predefined list
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    {form.watch("preferred_resolution_method.name") === "Replacement" && (
                        <FormField
                            control={form.control}
                            name="attachments"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Attachments (URLs)</FormLabel>
                                    <FormControl>
                                        <div className="space-y-2">
                                            {field.value?.map((url, index) => (
                                                <Input
                                                    key={index}
                                                    value={url}
                                                    onChange={(e) => {
                                                        const newAttachments = [...(field.value || [])]
                                                        newAttachments[index] = e.target.value
                                                        field.onChange(newAttachments)
                                                    }}
                                                    placeholder="https://example.com/image.jpg"
                                                />
                                            ))}
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() =>
                                                    field.onChange([...(field.value || []), ""])
                                                }
                                            >
                                                Add Attachment
                                            </Button>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}
                </div>

                <div className="space-y-4 p-6 border rounded-lg">
                    <h3 className="font-medium">Preferred Resolution Method</h3>

                    <FileUploadComponent
                        uploadApiHook={useAttachmentUpload}
                        label="Upload Documents"
                        description="PDFs and Word documents only"
                        // accept=".pdf,.doc,.docx"
                        multiple={true}
                        maxFiles={10}
                        showPreview={false}
                        className="custom-uploader"
                    />
                </div>

                <Button type="submit" disabled={isPending}>
                    {isPending ? "Submitting..." : "Submit Complaint"}
                </Button>
            </form>
        </Form>
    )
}