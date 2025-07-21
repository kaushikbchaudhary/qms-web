import React from 'react';
import {ComplaintForm} from "@/components/forms/complaint-form";

export default function page() {
    return (
        <div className="container py-8">
            <h1 className="text-2xl font-bold mb-6">New Complaint</h1>
            <ComplaintForm />
        </div>
    );
}