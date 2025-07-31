'use client';
import { useState } from "react";
import {UserForm} from "@/components/forms/user-form";
import {useCreateUser} from "@/hooks/api/useUser";

export default function CreateUserPage() {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const createUser = useCreateUser();
    const handleSubmit = async (values:any) => {
        setIsSubmitting(true);
        try {
            // const {mutate:createMutation} = useCreateUser();
            createUser.mutate(values, {
                onSuccess: () => {
                    // Clear paths after successful submission
                },
                onError: (error) => {
                    // error handling here
                }
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="container mx-auto py-8">
            <h1 className="text-2xl font-bold mb-6">Create New User</h1>
            <UserForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
        </div>
    );
}