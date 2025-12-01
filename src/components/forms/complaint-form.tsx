'use client'

import { useForm, useWatch, Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon } from '@radix-ui/react-icons'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { useCreateComplaint, useLookup } from '@/hooks/api/useComplaints'
import { useEffect, useMemo, useState } from 'react'
import { CreateComplaintPayload, MasterLookupItem, ReplacementDetails } from '@/lib/api/types/complaints'
import { FileUploadComponent } from '@/components/forms/FileUploadComponent'
import { useAttachmentManager } from '@/components/forms/AttachmentManager'
import { useComplaintFormRequirements } from '@/hooks/useComplaintFormRequirements'
import { buildComplaintSubmissionSchema } from '@/lib/validations/complaintSubmission'
import { GrammarInput } from '@/components/shared/GrammarInput'
import { ContextSuggestion } from '@/components/shared/ContextSuggestion'

type ComplaintFormSchema = ReturnType<typeof buildComplaintSubmissionSchema>
type ComplaintFormValues = z.infer<ComplaintFormSchema>

type ComplaintFormProps = {
    mode?: 'create' | 'edit'
    defaultValues?: Partial<ComplaintFormValues>
    initialAttachments?: string[]
    onSubmitOverride?: (payload: CreateComplaintPayload) => Promise<void>
    onSuccess?: () => void
    submitLabel?: string
    loading?: boolean
}

const mergeDeep = <T extends Record<string, any>>(base: T, overrides?: Partial<T>): T => {
    if (!overrides) return base
    const output: Record<string, any> = { ...base }
    Object.entries(overrides).forEach(([key, value]) => {
        if (value === undefined) return
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            output[key] = mergeDeep(output[key] ?? {}, value as any)
        } else {
            output[key] = value
        }
    })
    return output as T
}

export function ComplaintForm({
    mode = 'create',
    defaultValues,
    initialAttachments,
    onSubmitOverride,
    onSuccess,
    submitLabel,
    loading,
}: ComplaintFormProps) {
    const { requirements } = useComplaintFormRequirements()
    const schema = useMemo(() => buildComplaintSubmissionSchema(requirements), [requirements])
    const resolver = useMemo(() => zodResolver(schema) as Resolver<ComplaintFormValues>, [schema])
    const renderLabel = (label: string, path: string) => (
        <FormLabel className="flex items-center gap-1">
            <span>{label}</span>
            {requirements?.[path] && <span className="text-red-500">*</span>}
        </FormLabel>
    )

    const baseDefaults: ComplaintFormValues = {
        customer: {
            name: '',
            company: '',
            contact_number: '',
            email: '',
        },
        product_details: {
            model: '',
            batch_number: '',
            serial_number: '',
            purchase_date: new Date().toISOString(),
        },
        complaint_type: {
            name: 'Performance issue',
            description: 'Issues related to product performance',
            config: {
                _id: '687dc9f1b0e9176a170ac0bc',
                name: 'Performance issue',
                type: 'COMPLAINT_TYPE',
            },
        },
        issue_details: {
            description: '',
            problem_start_date: new Date().toISOString(),
            occurred_before: 'No',
            replication_steps: '',
        },
        customer_impact: '',
        previous_contact: {
            reported_before: 'No',
            reference_number: '',
            contact_date: '',
            person_contacted: '',
        },
        customer_actions: {
            troubleshooting_done: 'No',
            troubleshooting_description: '',
        },
        preferred_resolution_method: {
            name: 'Replacement',
            description: 'Replacement of the faulty product',
            config: {
                _id: '687dc9f1b0e9176a170ac0c2',
                name: 'Replacement',
                type: 'RESOLUTION_METHOD',
            },
        },
        replacement_details: {
            batch_number: '',
            serial_number: '',
            mfg_date: '',
        },
        attachments: [],
    }

    const mergedDefaults = useMemo(
        () => mergeDeep(baseDefaults, defaultValues),
        [defaultValues]
    )

    const form = useForm<ComplaintFormValues>({
        resolver,
        defaultValues: mergedDefaults,
    })

    useEffect(() => {
        form.reset(mergedDefaults)
    }, [schema, mergedDefaults])

    const [submissionDate] = useState(() => new Date())
    const [pathsAttachments, setPathsAttachments] = useState<string[]>(initialAttachments ?? [])
    const { attachments, addFiles, removeFile, setAttachments } = useAttachmentManager()

    useEffect(() => {
        if (initialAttachments && initialAttachments.length) {
            setPathsAttachments(initialAttachments)
            setAttachments(
                initialAttachments.map((path) => ({
                    id: path,
                    path,
                    status: 'success',
                }))
            )
        }
    }, [initialAttachments, setAttachments])

    const [complaintType, preferredResolution] = useWatch({
        control: form.control,
        name: ['complaint_type', 'preferred_resolution_method'],
    })

    const { mutate: createComplaint, isPending } = useCreateComplaint()
    const isSubmitting = loading ?? isPending;

    const normalizeOptional = (value?: string | null) =>
        value === undefined || value === null ? undefined : value;

    const onSubmit = async (values: ComplaintFormValues) => {
        try {
            const payload: CreateComplaintPayload = {
                ...values,
                product_details: {
                    ...values.product_details,
                    batch_number: normalizeOptional(values.product_details.batch_number),
                },
                issue_details: {
                    ...values.issue_details,
                    replication_steps: normalizeOptional(values.issue_details.replication_steps) ?? null,
                },
                complaint_type: {
                    ...values.complaint_type,
                    name: values.complaint_type.name ?? '',
                    description: values.complaint_type.description ?? null,
                },
                preferred_resolution_method: {
                    ...values.preferred_resolution_method,
                    name: values.preferred_resolution_method.name ?? '',
                    description: values.preferred_resolution_method.description ?? null,
                },
                replacement_details: values.replacement_details
                    ? {
                          ...values.replacement_details,
                          batch_number: normalizeOptional(values.replacement_details.batch_number),
                          serial_number: normalizeOptional(values.replacement_details.serial_number),
                          mfg_date: values.replacement_details.mfg_date
                              ? new Date(values.replacement_details.mfg_date).toISOString()
                              : undefined,
                      }
                    : ({} as ReplacementDetails),
                attachments: pathsAttachments,
            }
            if (onSubmitOverride) {
                await onSubmitOverride(payload)
                onSuccess?.()
            } else {
                createComplaint(payload, {
                    onSuccess: () => {
                        form.reset()
                        setAttachments([])
                        setPathsAttachments([])
                        onSuccess?.()
                    },
                    onError: () => {
                        // error handling placeholder
                    },
                })
            }
        } catch (error) {
            console.error('Error uploading attachments:', error)
        }
    }

    const {
        refetch: refetchComplaintType,
        data: dataComplaintType,
    } = useLookup({ type: 'COMPLAINT_TYPE' })

    const {
        refetch: refetchResolutionMethod,
        data: dataResolutionMethod,
    } = useLookup({ type: 'RESOLUTION_METHOD' })

    useEffect(() => {
        refetchComplaintType()
        refetchResolutionMethod()
    }, [refetchComplaintType, refetchResolutionMethod])

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="space-y-4">
                    <h2 className="text-2xl font-semibold">{mode === 'edit' ? 'Edit Complaint' : 'Complaint Form'}</h2>
                    <div className="grid grid-cols-1 gap-4 p-6 border rounded-lg md:grid-cols-3">
                        <div className="space-y-1">
                            <p className="font-medium">Date of Complaint Submission:</p>
                            <p className="text-sm text-muted-foreground">{format(submissionDate, 'PPP')}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="font-medium">Date:</p>
                            <p className="text-sm text-muted-foreground">{format(submissionDate, 'PPP')}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="font-medium">Complaint No:</p>
                            <p className="text-sm text-muted-foreground">Auto-generated upon submission</p>
                        </div>
                    </div>
                </div>

                <section className="space-y-4 p-6 border rounded-lg">
                    <h3 className="font-medium">Customer Details:</h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <FormField
                            control={form.control}
                            name="customer.name"
                            render={({ field }) => (
                                <FormItem>
                                    {renderLabel('Customer Name:', 'customer.name')}
                                    <FormControl>
                                        <Input placeholder="Enter customer name" {...field} />
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
                                    {renderLabel('Company (if applicable):', 'customer.company')}
                                    <FormControl>
                                        <Input placeholder="Enter company name" {...field} />
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
                                    {renderLabel('Contact Number:', 'customer.contact_number')}
                                    <FormControl>
                                        <Input
                                            placeholder="Enter contact number"
                                            {...field}
                                            inputMode="numeric"
                                            maxLength={10}
                                            onChange={(event) => {
                                                const digitsOnly = event.target.value.replace(/\D/g, "").slice(0, 10);
                                                field.onChange(digitsOnly);
                                            }}
                                        />
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
                                    {renderLabel('Email Address:', 'customer.email')}
                                    <FormControl>
                                        <Input placeholder="Enter email address" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </section>

                <section className="space-y-4 p-6 border rounded-lg">
                    <h3 className="font-medium">Product Details:</h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <FormField
                            control={form.control}
                            name="product_details.model"
                            render={({ field }) => (
                                <FormItem>
                                    {renderLabel('Product Name/Model:', 'product_details.model')}
                                    <FormControl>
                                        <Input placeholder="Enter product name or model" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="product_details.batch_number"
                            render={({ field }) => (
                                <FormItem>
                                    {renderLabel('Product Unique identifier/Batch no.:', 'product_details.batch_number')}
                                    <FormControl>
                                        <Input placeholder="Enter unique identifier or batch number" {...field} />
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
                                    {renderLabel('Serial Number:', 'product_details.serial_number')}
                                    <FormControl>
                                        <Input placeholder="Enter serial number" {...field} />
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
                                    {renderLabel('Date of Purchase/Rental/Lease:', 'product_details.purchase_date')}
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant={'outline'}
                                                    className={cn(
                                                        'w-[240px] pl-3 text-left font-normal',
                                                        !field.value && 'text-muted-foreground'
                                                    )}
                                                >
                                                    {field.value ? (
                                                        format(new Date(field.value), 'PPP')
                                                    ) : (
                                                        <span>Select a date</span>
                                                    )}
                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={field.value ? new Date(field.value) : undefined}
                                                onSelect={(date) => field.onChange(date?.toISOString())}
                                                disabled={(date) =>
                                                    date > new Date() || date < new Date('1900-01-01')
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
                </section>

                <section className="space-y-4 p-6 border rounded-lg">
                    <h3 className="font-medium">Nature of Complaint:</h3>
                    <FormField
                        control={form.control}
                        name="complaint_type"
                        render={({ field }) => (
                            <FormItem className="space-y-3">
                                {renderLabel('Type of Complaint (Select one):', 'complaint_type.name')}
                                <FormControl>
                                    <RadioGroup
                                        onValueChange={(value) => {
                                            const selected = dataComplaintType?.find(
                                                (item: MasterLookupItem) => item._id === value,
                                            )
                                            if (selected) {
                                                form.setValue('complaint_type', {
                                                    name: selected.name,
                                                    description: selected.description ?? null,
                                                    config: {
                                                        _id: selected._id,
                                                        name: selected.name,
                                                        type: selected.type,
                                                    },
                                                })
                                            }
                                        }}
                                        value={field.value?.config?._id}
                                        className="flex flex-col space-y-2"
                                    >
                                        {dataComplaintType?.map((type: MasterLookupItem) => (
                                            <FormItem
                                                key={type._id}
                                                className="flex items-center space-x-3 space-y-0"
                                            >
                                                <FormControl>
                                                    <RadioGroupItem value={type._id} />
                                                </FormControl>
                                                <span className="text-sm">{type.name}</span>
                                            </FormItem>
                                        ))}
                                    </RadioGroup>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    {complaintType?.config?.name === 'Other' && (
                        <FormField
                            control={form.control}
                            name="complaint_type.description"
                            render={({ field }) => (
                                <FormItem>
                                    {renderLabel('Other (please specify):', 'complaint_type.description')}
                                    <FormControl>
                                        <Input
                                            placeholder="Enter complaint type"
                                            {...field}
                                            value={field.value ?? ''}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}
                </section>

                <section className="space-y-4 p-6 border rounded-lg">
                    <h3 className="font-medium">Detailed Description of the Issue:</h3>
                    <FormField
                        control={form.control}
                        name="issue_details.description"
                        render={({ field }) => (
                            <FormItem>
                                {renderLabel('Issue Description:', 'issue_details.description')}
                                <FormControl>
                                    <GrammarInput
                                        {...field}
                                        value={field.value ?? ''}
                                        onChange={field.onChange}
                                        placeholder="Describe the issue in detail"
                                        className="min-h-[120px]"
                                        showSuggestion={false}
                                    />
                                </FormControl>
                                <FormMessage />
                                <ContextSuggestion
                                    text={field.value ?? ''}
                                    onSelect={(pick) => {
                                        if (pick.issue) {
                                            field.onChange(pick.issue);
                                        }
                                        if (pick.resolution) {
                                            form.setValue('customer_actions.troubleshooting_description', pick.resolution);
                                        }
                                        if (pick.rootCause) {
                                            form.setValue('complaint_type.description', pick.rootCause);
                                        }
                                        if (pick.capa) {
                                            form.setValue('preferred_resolution_method.description', pick.capa);
                                        }
                                    }}
                                />
                            </FormItem>
                        )}
                    />
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <FormField
                            control={form.control}
                            name="issue_details.problem_start_date"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    {renderLabel('When did the problem start?', 'issue_details.problem_start_date')}
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant={'outline'}
                                                    className={cn(
                                                        'w-[240px] pl-3 text-left font-normal',
                                                        !field.value && 'text-muted-foreground'
                                                    )}
                                                >
                                                    {field.value ? (
                                                        format(new Date(field.value), 'PPP')
                                                    ) : (
                                                        <span>Select a date</span>
                                                    )}
                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={field.value ? new Date(field.value) : undefined}
                                                onSelect={(date) => field.onChange(date?.toISOString())}
                                                disabled={(date) =>
                                                    date > new Date() || date < new Date('1900-01-01')
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
                                    {renderLabel('Has the issue occurred before?', 'issue_details.occurred_before')}
                                    <FormControl>
                                        <RadioGroup
                                            onValueChange={field.onChange}
                                            value={field.value}
                                            className="flex space-x-4"
                                        >
                                            <FormItem className="flex items-center space-x-2 space-y-0">
                                                <FormControl>
                                                    <RadioGroupItem value="Yes" />
                                                </FormControl>
                                                <span className="text-sm">Yes</span>
                                            </FormItem>
                                            <FormItem className="flex items-center space-x-2 space-y-0">
                                                <FormControl>
                                                    <RadioGroupItem value="No" />
                                                </FormControl>
                                                <span className="text-sm">No</span>
                                            </FormItem>
                                        </RadioGroup>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <FormField
                        control={form.control}
                        name="issue_details.replication_steps"
                        render={({ field }) => (
                            <FormItem>
                                {renderLabel('Steps to replicate the issue (if applicable):', 'issue_details.replication_steps')}
                                <FormControl>
                                    <GrammarInput
                                        {...field}
                                        value={field.value ?? ''}
                                        onChange={field.onChange}
                                        placeholder="List the steps to replicate the issue"
                                        className="min-h-[80px]"
                                        showSuggestion={false}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </section>

                <section className="space-y-4 p-6 border rounded-lg">
                    <h3 className="font-medium">Customer Impact:</h3>
                    <FormField
                        control={form.control}
                        name="customer_impact"
                        render={({ field }) => (
                            <FormItem>
                                {renderLabel('How is this issue affecting you?', 'customer_impact')}
                                <FormControl>
                                    <GrammarInput
                                        {...field}
                                        value={field.value ?? ''}
                                        onChange={field.onChange}
                                        placeholder="Explain how the issue impacts you"
                                        className="min-h-[100px]"
                                        showSuggestion={false}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </section>

                <section className="space-y-4 p-6 border rounded-lg">
                    <h3 className="font-medium">Previous Contact Regarding Issue:</h3>
                    <FormField
                        control={form.control}
                        name="previous_contact.reported_before"
                        render={({ field }) => (
                            <FormItem className="space-y-3">
                                {renderLabel('Have you reported this issue before? ☐ Yes / ☐ No', 'previous_contact.reported_before')}
                                <FormControl>
                                    <RadioGroup
                                        onValueChange={field.onChange}
                                        value={field.value}
                                        className="flex space-x-4"
                                    >
                                        <FormItem className="flex items-center space-x-2 space-y-0">
                                            <FormControl>
                                                <RadioGroupItem value="Yes" />
                                            </FormControl>
                                            <span className="text-sm">Yes</span>
                                        </FormItem>
                                        <FormItem className="flex items-center space-x-2 space-y-0">
                                            <FormControl>
                                                <RadioGroupItem value="No" />
                                            </FormControl>
                                            <span className="text-sm">No</span>
                                        </FormItem>
                                    </RadioGroup>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    {form.watch('previous_contact.reported_before') === 'Yes' && (
                        <div className="space-y-4">
                            <p className="text-sm font-medium">
                                If yes, provide the reference number and date of contact:
                            </p>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="previous_contact.reference_number"
                                    render={({ field }) => (
                                        <FormItem>
                                            {renderLabel('Reference Number:', 'previous_contact.reference_number')}
                                            <FormControl>
                                                <Input placeholder="Enter reference number" {...field} />
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
                                            {renderLabel('Date of contact:', 'previous_contact.contact_date')}
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant={'outline'}
                                                            className={cn(
                                                                'w-[240px] pl-3 text-left font-normal',
                                                                !field.value && 'text-muted-foreground'
                                                            )}
                                                        >
                                                            {field.value ? (
                                                                format(new Date(field.value), 'PPP')
                                                            ) : (
                                                                <span>Select a date</span>
                                                            )}
                                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={field.value ? new Date(field.value) : undefined}
                                                        onSelect={(date) => field.onChange(date?.toISOString())}
                                                        disabled={(date) =>
                                                            date > new Date() || date < new Date('1900-01-01')
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
                            <FormField
                                control={form.control}
                                name="previous_contact.person_contacted"
                                render={({ field }) => (
                                    <FormItem>
                                        {renderLabel('Person contacted (if applicable):', 'previous_contact.person_contacted')}
                                        <FormControl>
                                            <Input
                                                placeholder="Enter the name of the person contacted"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    )}
                </section>

                <section className="space-y-4 p-6 border rounded-lg">
                    <h3 className="font-medium">Action Taken by Customer (if any):</h3>
                    <FormField
                        control={form.control}
                        name="customer_actions.troubleshooting_done"
                        render={({ field }) => (
                            <FormItem className="space-y-3">
                                {renderLabel('Have you attempted any troubleshooting steps? ☐ Yes / ☐ No', 'customer_actions.troubleshooting_done')}
                                <FormControl>
                                    <RadioGroup
                                        onValueChange={field.onChange}
                                        value={field.value}
                                        className="flex space-x-4"
                                    >
                                        <FormItem className="flex items-center space-x-2 space-y-0">
                                            <FormControl>
                                                <RadioGroupItem value="Yes" />
                                            </FormControl>
                                            <span className="text-sm">Yes</span>
                                        </FormItem>
                                        <FormItem className="flex items-center space-x-2 space-y-0">
                                            <FormControl>
                                                <RadioGroupItem value="No" />
                                            </FormControl>
                                            <span className="text-sm">No</span>
                                        </FormItem>
                                    </RadioGroup>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    {form.watch('customer_actions.troubleshooting_done') === 'Yes' && (
                        <FormField
                            control={form.control}
                            name="customer_actions.troubleshooting_description"
                                    render={({ field }) => (
                                        <FormItem>
                                            {renderLabel('If yes, please describe the actions taken:', 'customer_actions.troubleshooting_description')}
                                            <FormControl>
                                                <GrammarInput
                                                    {...field}
                                                    value={field.value ?? ''}
                                                    onChange={field.onChange}
                                                    placeholder="Describe the troubleshooting actions taken"
                                                    className="min-h-[80px]"
                                                    showSuggestion={false}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                        />
                    )}
                </section>

                <section className="space-y-4 p-6 border rounded-lg">
                    <h3 className="font-medium">Preferred Method of Resolution:</h3>
                    <FormField
                        control={form.control}
                        name="preferred_resolution_method"
                        render={({ field }) => (
                            <FormItem className="space-y-3">
                                {renderLabel('How would you like us to resolve this issue?', 'preferred_resolution_method.name')}
                                <FormControl>
                                    <RadioGroup
                                        onValueChange={(value) => {
                                            const selected = dataResolutionMethod?.find(
                                                (item: MasterLookupItem) => item._id === value,
                                            )
                                            if (selected) {
                                                form.setValue('preferred_resolution_method', {
                                                    name: selected.name,
                                                    description: selected.description ?? null,
                                                    config: {
                                                        _id: selected._id,
                                                        name: selected.name,
                                                        type: selected.type,
                                                    },
                                                })
                                            }
                                        }}
                                        value={field.value?.config?._id}
                                        className="flex flex-col space-y-2"
                                    >
                                        {dataResolutionMethod?.map((type: MasterLookupItem) => (
                                            <FormItem
                                                key={type._id}
                                                className="flex items-center space-x-3 space-y-0"
                                            >
                                                <FormControl>
                                                    <RadioGroupItem value={type._id} />
                                                </FormControl>
                                                <span className="text-sm">{type.name}</span>
                                            </FormItem>
                                        ))}
                                    </RadioGroup>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    {preferredResolution?.config?.name === 'Other' && (
                        <FormField
                            control={form.control}
                            name="preferred_resolution_method.description"
                            render={({ field }) => (
                                <FormItem>
                                    {renderLabel('Other (please specify):', 'preferred_resolution_method.description')}
                                    <FormControl>
                                        <Input
                                            placeholder="Describe your preferred resolution"
                                            {...field}
                                            value={field.value ?? ''}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}
                    {preferredResolution?.config?.name === 'Replacement' && (
                        <div className="space-y-4">
                            <p className="text-sm font-medium">
                                If Replacement done Provide Replacement details(Batch no., Serial Number, Mfg.
                                Date etc.):
                            </p>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                <FormField
                                    control={form.control}
                                    name="replacement_details.batch_number"
                                    render={({ field }) => (
                                        <FormItem>
                                            {renderLabel('Replacement Batch no.:', 'replacement_details.batch_number')}
                                            <FormControl>
                                                <Input placeholder="Enter batch number" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="replacement_details.serial_number"
                                    render={({ field }) => (
                                        <FormItem>
                                            {renderLabel('Replacement Serial Number:', 'replacement_details.serial_number')}
                                            <FormControl>
                                                <Input
                                                    placeholder="Enter replacement serial number"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="replacement_details.mfg_date"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            {renderLabel('Manufacturing Date:', 'replacement_details.mfg_date')}
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant={'outline'}
                                                            className={cn(
                                                                'w-[240px] pl-3 text-left font-normal',
                                                                !field.value && 'text-muted-foreground'
                                                            )}
                                                        >
                                                            {field.value ? (
                                                                format(new Date(field.value), 'PPP')
                                                            ) : (
                                                                <span>Select a date</span>
                                                            )}
                                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={field.value ? new Date(field.value) : undefined}
                                                        onSelect={(date) => field.onChange(date?.toISOString())}
                                                        disabled={(date) =>
                                                            date > new Date() || date < new Date('1900-01-01')
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
                    )}
                </section>

                <section className="space-y-4 p-6 border rounded-lg">
                    <h3 className="font-medium">Attachments (if any):</h3>
                    <p className="text-sm text-muted-foreground">
                        Attach supporting documents/images: [Attach files if needed, such as photos of the product or
                        error messages]
                    </p>
                    <div className="max-w-[1200px] mx-auto">
                        <FileUploadComponent
                            addAttachmentPath={setPathsAttachments}
                            attachments={attachments}
                            addFiles={addFiles}
                            removeFile={removeFile}
                        />
                    </div>
                </section>

                <section className="space-y-4 p-6 border rounded-lg">
                    <h3 className="font-medium">Complaint Handling Section (For Internal Use Only):</h3>
                    <div className="space-y-4 text-sm text-muted-foreground">
                        <div className="space-y-1">
                            <p className="font-medium text-foreground">Received By:</p>
                            <p>Name:</p>
                            <p>Position:</p>
                            <p>Date:</p>
                        </div>
                        <div className="space-y-1">
                            <p className="font-medium text-foreground">Investigation:</p>
                            <p>12.1 Date of Investigation:</p>
                            <p>12.2 Investigating Officer:</p>
                            <p>Sr No.</p>
                            <p>Name</p>
                            <p>Designation</p>
                            <p>Sign</p>
                        </div>
                        <div className="space-y-1">
                            <p className="font-medium text-foreground">12.3 Root Cause Identified:</p>
                            <p>☐ Device Failure</p>
                            <p>☐ Manufacturing Issue</p>
                            <p>☐ Labelling/IFU</p>
                            <p>☐ Customer Misuse</p>
                            <p>☐ No Fault Found</p>
                            <p>☐ Other: _____________________</p>
                            <p>Root Cause Description:</p>
                        </div>
                        <div className="space-y-1">
                            <p className="font-medium text-foreground">Corrective/Preventive Action (if applicable)</p>
                            <p>CAPA Initiated? ☐ Yes ☐ No</p>
                            <p>CAPA Number: _______________</p>
                            <p>Action Taken (if any):</p>
                            <p>Investigation Completion date: __________________</p>
                            <p>Above Action Approved By (QA/RA Head or Designee):</p>
                            <p>Name: ____________________</p>
                            <p>Signature: ____________________</p>
                            <p>Date: ____________________</p>
                        </div>
                        <div className="space-y-1">
                            <p className="font-medium text-foreground">Customer Communication</p>
                            <p>Date of Response to Customer: ______________</p>
                            <p>Mode: ☐ Email ☐ Call ☐ Letter ☐ Other: ___________</p>
                            <p>Summary of Response Provided:</p>
                            <p>Update to Risk Management Report Require?: ☐ Yes ☐ No</p>
                            <p>If Yes, Provide details:</p>
                        </div>
                        <div className="space-y-1">
                            <p className="font-medium text-foreground">Complaint Closure</p>
                            <p>Final Disposition:</p>
                            <p>☐ Confirmed Device Defect</p>
                            <p>☐ No Fault Found</p>
                            <p>☐ Misuse by Customer</p>
                            <p>☐ Duplicate Complaint</p>
                            <p>☐ Other: ____________</p>
                            <p>Reviewed By (Investigator):</p>
                            <p>Sr No.</p>
                            <p>Name</p>
                            <p>Designation</p>
                            <p>Sign</p>
                            <p>Approved By (QA/RA Head or Designee):</p>
                            <p>Name: ____________________</p>
                            <p>Signature: ____________________</p>
                            <p>Date: ____________________</p>
                        </div>
                    </div>
                </section>

                <Button type="submit" disabled={isSubmitting} className="align-right">
                    {isSubmitting ? 'Submitting...' : (submitLabel || (mode === 'edit' ? 'Update Complaint' : 'Submit Complaint'))}
                </Button>
            </form>
        </Form>
    )
}
