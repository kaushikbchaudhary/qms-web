"use client"
import { Resolver, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { InvestigationFormData } from "@/lib/validations/complaint"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, CheckCircle2, Loader2 } from "lucide-react"
import { format, parseISO } from "date-fns"
import Link from "next/link"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Textarea} from "@/components/ui/textarea";
import {useUpdateInvestigation} from "@/hooks/api/useComplaints";
import { useInvestigationFormRequirements } from "@/hooks/useComplaintFormRequirements";
import { buildInvestigationFormSchema } from "@/lib/validations/complaintSubmission";
import { useEffect, useMemo, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAvailableCapas, useValidateCapa } from "@/hooks/api/useCapa";
import type { CapaSummary } from "@/lib/api/types/capa";
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

    const initialValues = useMemo(() => {
        if (!defaultValues) {
            return {
                completion_details: {},
            } as Partial<InvestigationFormData>;
        }
        return {
            ...defaultValues,
            completion_details: defaultValues.completion_details ?? {},
        } as Partial<InvestigationFormData>;
    }, [defaultValues])

    const form = useForm<InvestigationFormData>({
        resolver,
        defaultValues: initialValues,
    })

    useEffect(() => {
        form.reset({ ...form.getValues() })
    }, [schema, form])

    const [capaMode, setCapaMode] = useState<'existing' | 'create'>('existing');
    const [validatedCapa, setValidatedCapa] = useState<CapaSummary | null>(null);

    const capaInitiated = form.watch("capa.initiated");
    const capaNumberValue = form.watch("capa.number");

    const {
        data: availableCapas = [],
        isFetching: isLoadingCapas,
        refetch: refetchCapas,
    } = useAvailableCapas({ enabled: Boolean(capaInitiated) });

    const validateCapaMutation = useValidateCapa();
    const { mutateAsync, isPending } = useUpdateInvestigation(complaintId);
    const apiBaseUrl = useMemo(
        () => process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, '') ?? '',
        [],
    );

    const buildFileUrl = (path?: string | null) => {
        if (!path) return null;
        return `${apiBaseUrl ? `${apiBaseUrl}/` : ''}${path.replace(/^\/+/, '')}`;
    };

    useEffect(() => {
        if (!capaInitiated) {
            setCapaMode('existing');
            setValidatedCapa(null);
        }
    }, [capaInitiated]);

    useEffect(() => {
        if (!capaNumberValue) {
            setValidatedCapa(null);
            return;
        }

        if (validatedCapa && validatedCapa.capaId !== capaNumberValue) {
            setValidatedCapa(null);
        }
    }, [capaNumberValue, validatedCapa]);

    const handleValidateCapa = async (value?: string | null) => {
        const trimmed = typeof value === 'string' ? value.trim() : '';
        if (!trimmed) {
            form.setError("capa.number", { type: "manual", message: "Enter a CAPA number to validate." });
            setValidatedCapa(null);
            return;
        }

        try {
            setValidatedCapa(null);
            const response = await validateCapaMutation.mutateAsync(trimmed);
            setValidatedCapa(response.capa);
            form.setValue("capa.number", response.capa.capaId, { shouldDirty: true, shouldTouch: true });
            form.clearErrors("capa.number");
        } catch (error) {
            setValidatedCapa(null);
        }
    };

    const formatCapaDate = (value?: string | null) => {
        if (!value) return '—';
        try {
            return format(parseISO(value), 'dd MMM yyyy');
        } catch {
            return value;
        }
    };

    const availableHasEntries = availableCapas.length > 0;
    const validatedFileUrl = buildFileUrl(validatedCapa?.fileUrl);

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

                {/* CAPA Section */}
                <div className="space-y-4">
                    <h3 className="font-medium">Corrective and Preventive Action (CAPA)</h3>
                    <FormField
                        control={form.control}
                        name="capa.initiated"
                        render={({ field }) => (
                            <FormItem className="rounded-lg border border-yellow-300 bg-yellow-50 p-4 shadow-sm">
                                <FormLabel className="text-base font-semibold text-yellow-900">CAPA Initiated?</FormLabel>
                                <p className="mb-3 text-xs text-yellow-800">
                                    Select Yes or No to capture whether this complaint proceeds to CAPA.
                                </p>
                                <FormControl>
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            variant={field.value ? "default" : "outline"}
                                            onClick={() => field.onChange(true)}
                                            className="min-w-[64px]"
                                        >
                                            Yes
                                        </Button>
                                        <Button
                                            type="button"
                                            variant={field.value === false ? "default" : "outline"}
                                            onClick={() => field.onChange(false)}
                                            className="min-w-[64px]"
                                        >
                                            No
                                        </Button>
                                    </div>
                                </FormControl>
                            </FormItem>
                        )}
                    />

                    {capaInitiated && (
                        <div className="space-y-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4 shadow-sm">
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    type="button"
                                    variant={capaMode === 'existing' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => {
                                        setCapaMode('existing');
                                        setValidatedCapa(null);
                                    }}
                                >
                                    Link existing CAPA
                                </Button>
                                <Button
                                    type="button"
                                    variant={capaMode === 'create' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => {
                                        setCapaMode('create');
                                        setValidatedCapa(null);
                                    }}
                                >
                                    Create new CAPA
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => refetchCapas()}
                                    disabled={isLoadingCapas}
                                >
                                    {isLoadingCapas ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Refreshing
                                        </>
                                    ) : (
                                        "Refresh CAPAs"
                                    )}
                                </Button>
                            </div>

                            <FormField
                                control={form.control}
                                name="capa.number"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>CAPA Number</FormLabel>
                                        <FormControl>
                                            <div className="flex flex-col gap-3">
                                                <div className="flex flex-col gap-2 md:flex-row">
                                                    <Input
                                                        {...field}
                                                        value={field.value ?? ''}
                                                        placeholder="Enter CAPA identifier (e.g. CAPA-XXXXX)"
                                                        onChange={(event) => {
                                                            form.clearErrors("capa.number");
                                                            setValidatedCapa(null);
                                                            field.onChange(event.target.value);
                                                        }}
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="secondary"
                                                        onClick={() => handleValidateCapa(field.value)}
                                                        disabled={validateCapaMutation.isPending}
                                                        className="md:w-auto"
                                                    >
                                                        {validateCapaMutation.isPending ? (
                                                            <>
                                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                Validating…
                                                            </>
                                                        ) : (
                                                            "Validate"
                                                        )}
                                                    </Button>
                                                </div>

                                                {capaMode === 'existing' && (
                                                    availableHasEntries ? (
                                                        <div className="space-y-2 rounded-md border border-dashed border-yellow-300 bg-white/60 p-3">
                                                            <div className="text-xs font-semibold uppercase text-yellow-900">
                                                                Available CAPAs
                                                            </div>
                                                            <Select
                                                                value={field.value ?? ''}
                                                                onValueChange={(value) => {
                                                                    form.clearErrors("capa.number");
                                                                    setValidatedCapa(null);
                                                                    field.onChange(value);
                                                                }}
                                                            >
                                                                <SelectTrigger className="h-9 bg-white">
                                                                    <SelectValue placeholder="Choose an unlinked CAPA" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {availableCapas.map((capa) => (
                                                                        <SelectItem key={capa.capaId} value={capa.capaId}>
                                                                            {capa.capaId} • {formatCapaDate(capa.initiationDate)}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                            <p className="text-[11px] text-muted-foreground">
                                                                Selecting an option copies the CAPA number into the field above.
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <p className="text-xs text-muted-foreground">
                                                            No unlinked CAPA records found. Create a new CAPA to proceed.
                                                        </p>
                                                    )
                                                )}

                                                {capaMode === 'create' && (
                                                    <Alert className="border-blue-200 bg-blue-50">
                                                        <AlertTitle>Create a new CAPA</AlertTitle>
                                                        <AlertDescription className="space-y-2">
                                                            <p className="text-xs text-blue-900">
                                                                Open the CAPA form to generate a new identifier, then return here to validate and link it.
                                                            </p>
                                                            <div className="flex flex-wrap gap-2">
                                                                <Button asChild size="sm">
                                                                    <Link
                                                                        href="/dashboard/capa/new"
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                    >
                                                                        Open CAPA Form
                                                                    </Link>
                                                                </Button>
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => refetchCapas()}
                                                                >
                                                                    Refresh available CAPAs
                                                                </Button>
                                                            </div>
                                                        </AlertDescription>
                                                    </Alert>
                                                )}

                                                {validatedCapa && (
                                                    <Alert className="border-green-200 bg-green-50">
                                                        <CheckCircle2 className="text-green-600" />
                                                        <AlertTitle>CAPA validated</AlertTitle>
                                                        <AlertDescription className="space-y-2">
                                                            <div className="font-medium text-green-900">
                                                                {validatedCapa.capaId}
                                                            </div>
                                                            <p className="text-xs text-muted-foreground">
                                                                Initiation date: {formatCapaDate(validatedCapa.initiationDate)}
                                                            </p>
                                                            {validatedFileUrl && (
                                                                <Button
                                                                    asChild
                                                                    size="sm"
                                                                    variant="secondary"
                                                                >
                                                                    <Link
                                                                        href={validatedFileUrl}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                    >
                                                                        View CAPA PDF
                                                                    </Link>
                                                                </Button>
                                                            )}
                                                        </AlertDescription>
                                                    </Alert>
                                                )}
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    )}
                </div>

                <Button type="submit" disabled={form.formState.isSubmitting || isPending}>
                    {form.formState.isSubmitting || isPending ? "Saving..." : "Save Investigation"}
                </Button>
            </form>
        </Form>
    )
}
