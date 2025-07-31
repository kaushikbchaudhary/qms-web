'use client';
import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import {UserForm} from "@/components/forms/user-form";

export default function EditUserPage() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [defaultValues, setDefaultValues] = useState(null);
    const router = useRouter();
    const { id } = router.query;

    useEffect(() => {
        if (id) {
            axios.get(`/api/v1/users/${id}`, {
                withCredentials: true,
            })
                .then((response) => {
                    setDefaultValues(response.data);
                });
        }
    }, [id]);

    const handleSubmit = async (values:any) => {
        setIsSubmitting(true);
        try {
            await axios.patch(`/api/v1/users/${id}`, values, {
                withCredentials: true,
            });
            router.push("/users");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!defaultValues) return <div>Loading...</div>;

    return (
        <div className="container mx-auto py-8">
            <h1 className="text-2xl font-bold mb-6">Edit User</h1>
            <UserForm
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                defaultValues={defaultValues}
                mode="edit"
            />
        </div>
    );
}