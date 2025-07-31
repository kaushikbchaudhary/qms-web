// components/user-form.tsx
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
import {roles as role} from "@/config/roles";
import {toast} from "sonner";
import {userFormSchema, UserFormValues} from "@/components/users/schemas/user";
import {Loader2} from "lucide-react";

interface UserFormProps {
    defaultValues?: Partial<UserFormValues>;
    onSubmit: (values: UserFormValues) => Promise<void>;
    isSubmitting: boolean;
    mode?: "create" | "edit";
}

export function UserForm({
                             defaultValues,
                             onSubmit,
                             isSubmitting,
                             mode = "create",
                         }: UserFormProps) {
    // const { toast } = useToast();

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
            ...defaultValues,
        },
    });

    const handleSubmit = async (values: UserFormValues) => {
        try {
            await onSubmit(values);
            toast(`User ${mode === "create" ? "created" : "updated"} successfully`)
            // toast({
            //     title: "Success",
            //     description: `User ${mode === "create" ? "created" : "updated"} successfully`,
            // });
        } catch (error:any) {
            toast( error.message)
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
                                        disabled={mode === "edit"}
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
                                        disabled={mode === "edit"}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="countryCode"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Country Code</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                                        label: r.replace("-", " "),
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
                </div>

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
        </Form>
    );
}