'use client';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";
// import { useToast } from "@/components/ui/use-toast";
import {ROLE_LABELS, roles as role} from "@/config/roles";
// import {toast} from "sonner";
import {userFormSchema, UserFormValues} from "@/components/users/schemas/user";
import {Loader2, Upload, Eraser} from "lucide-react";
import {DeleteConfirmDialog} from "@/components/auth/delete-confirm-dialog";
import {useRef, useState} from "react";
import {useDeleteUser, useUserSignatureDelete, useUserSignatureUpload} from "@/hooks/api/useUser";
import { SignaturePreviewModal } from "@/components/forms/SignaturePreviewModal";
import { SignaturePadDialog } from "@/components/forms/SignaturePadDialog";
import { toast } from "sonner";

interface UserFormProps {
    defaultValues?: Partial<UserFormValues> | any;
    onSubmit: (values: UserFormValues) => Promise<void>;
    isSubmitting: boolean;
    mode?: "create" | "edit";
    id?: string;
}

export function UserForm({
                             defaultValues,
                             onSubmit,
                             isSubmitting,
                             mode = "create",
                                id = "",
                         }: UserFormProps) {
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const { mutate: deleteUser, isPending } = useDeleteUser();
    const form = useForm<UserFormValues>({
        resolver: zodResolver(userFormSchema),
        defaultValues: {
            firstName: "",
            middleName: "",
            lastName: "",
            emailId: "",
            contact: "",
            countryCode: "+91",
            role: [],
            organization: "",
            signature: undefined,
            ...defaultValues,
        },
    });
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const { mutateAsync: uploadSignature, isPending: isUploadingSignature } = useUserSignatureUpload();
    const { mutateAsync: removeSignature, isPending: isDeletingSignature } = useUserSignatureDelete();

    const handleSignatureUpload = async (file: File) => {
        try {
            const result = await uploadSignature({
                file,
                userId: mode === 'edit' ? id : undefined,
            });
            form.setValue('signature', result, { shouldDirty: true, shouldTouch: true });
            form.clearErrors('signature');
            toast.success('Signature uploaded successfully.');
        } catch (error) {
            console.error('Failed to upload signature', error);
            toast.error('Failed to upload signature.');
        }
    };

    const handleSignatureRemove = async () => {
        const current = form.getValues('signature');
        if (!current?.path) {
            form.setValue('signature', undefined, { shouldDirty: true });
            return;
        }

        try {
            await removeSignature(current.path);
        } catch (error) {
            console.warn('Unable to delete signature from server', error);
        } finally {
            form.setValue('signature', undefined, { shouldDirty: true });
            toast.success('Signature removed.');
        }
    };

    const handleSubmit = async (values: UserFormValues) => {
        try {
            await onSubmit(values);
            // toast(`User ${mode === "create" ? "created" : "updated"} successfully`)
            // toast({
            //     title: "Success",
            //     description: `User ${mode === "create" ? "created" : "updated"} successfully`,
            // });
        } catch (error:any) {
            // toast( error.message)
            // toast(`User ${mode === "create" ? "created" : "updated"} failed`)
            // toast({
            //     title: "Error",
            //     description: error.message,
            //     variant: "destructive",
            // });
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>First Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="John" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="middleName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Middle Name (Optional)</FormLabel>
                                <FormControl>
                                    <Input placeholder="Michael" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Last Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="Doe" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="emailId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="john.doe@example.com"
                                        type="email"
                                        {...field}
                                        // disabled={mode === "edit"}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="contact"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Contact Number</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="1234567890"
                                        {...field}
                                        inputMode="numeric"
                                        maxLength={10}
                                        onChange={(event) => {
                                            const digitsOnly = event.target.value.replace(/\D/g, "").slice(0, 10);
                                            field.onChange(digitsOnly);
                                        }}
                                        // disabled={mode === "edit"}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="countryCode"
                        disabled={mode === "edit"}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Country Code</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={mode === "edit"}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select country code" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="+91">+91 (India)</SelectItem>
                                        <SelectItem value="+1">+1 (USA/Canada)</SelectItem>
                                        <SelectItem value="+44">+44 (UK)</SelectItem>
                                        {/* Add more country codes as needed */}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="role"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Role</FormLabel>
                                <MultiSelect
                                    selected={field.value}
                                    options={Object.values(role).map((r) => ({
                                        value: r,
                                        label: ROLE_LABELS[r as role] ?? r.replace(/[-_]/g, " "),
                                    }))}
                                    {...field}
                                    className="w-full"
                                />
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="organization"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Organization</FormLabel>
                                <FormControl>
                                    <Input placeholder="Acme Inc" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="signature"
                        render={({ field }) => {
                            const signatureValue = field.value;
                            const hasSignature = !!signatureValue?.path
                            return (
                                <FormItem className="md:col-span-2">
                                    <FormLabel>Digital Signature</FormLabel>
                                    <FormControl>
                                        <div className="space-y-3">
                                            {hasSignature && (
                                                <div className="flex items-center gap-3">
                                                    <SignaturePreviewModal signaturePath={signatureValue?.path ?? ''} source="user" />
                                                    <span className="text-sm text-muted-foreground truncate">
                                                        {signatureValue?.filename ?? 'Signature image'}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="flex flex-wrap gap-3">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    disabled={isUploadingSignature}
                                                    onClick={() => fileInputRef.current?.click()}
                                                >
                                                    <Upload className="mr-2 h-4 w-4" />
                                                    {isUploadingSignature ? 'Uploading…' : 'Upload image'}
                                                </Button>
                                                <SignaturePadDialog
                                                    onSave={handleSignatureUpload}
                                                    disabled={isUploadingSignature}
                                                />
                                                {hasSignature && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        disabled={isDeletingSignature}
                                                        onClick={handleSignatureRemove}
                                                    >
                                                        <Eraser className="mr-2 h-4 w-4" /> Remove
                                                    </Button>
                                                )}
                                            </div>
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(event) => {
                                                    const file = event.target.files?.[0]
                                                    if (file) {
                                                        handleSignatureUpload(file)
                                                        event.target.value = ''
                                                    }
                                                }}
                                            />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )
                        }}
                    />
                </div>

                {mode === "create" && (
                    <p className="text-xs text-muted-foreground">
                        New users start with the default password <span className="font-semibold tracking-widest">000000</span>. Share it securely and remind them to update it after signing in.
                    </p>
                )}

                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                        <span className="flex items-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {mode === "create" ? "Creating..." : "Updating..."}
            </span>
                    ) : (
                        <span>{mode === "create" ? "Create User" : "Update User"}</span>
                    )}
                </Button>
            </form>
            {
                mode === "edit" && (
                    <>
                    <p className="mt-4 text-sm text-gray-500">
                        Note: You cannot change the email or contact number once the user is created.
                    </p>
                <div className="container mx-auto py-4">
                <h1 className="text-2xl font-bold mb-4">Delete user</h1>

            {/* Profile content here */}

            <Button
                variant="destructive"
                className="mt-8"
                onClick={() => setShowDeleteDialog(true)}
            >
                Delete My Account
            </Button>

            <DeleteConfirmDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                title="Delete Your Account"
                description="This will permanently delete your account and all associated data. This action cannot be undone."
                onConfirm={async () => { await deleteUser(id); }}
                redirectAfterDelete="/"
            />
        </div>
                    </>
                )
            }
        </Form>
    );
}
