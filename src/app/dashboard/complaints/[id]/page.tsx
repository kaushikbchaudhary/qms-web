'use client';
import React from 'react';
import {RoleBasedFormSection} from "@/providers/RoleBasedFormSection";
import {InvestigationForm} from "@/components/forms/InvestigationForm";
import {roles} from "@/config/roles";


export default function page({ params }: { params: Promise<{ id: string }> }) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { id } = React.use(params);
    const props = {
        complaintId: id,
        defaultValues: {}, // Fetch or set default values as needed
        onSuccess: () => {
            // Handle success, e.g., redirect or show a success message
            console.log("Investigation form submitted successfully");
        },
    };
    return (
        <div className=" items-center justify-center">
            {/*<h1 className="text-2xl font-bold mb-4">Complaints Page</h1>*/}
            {/*<p className="text-gray-600">This is the complaints page.</p>*/}
            <RoleBasedFormSection requiredRoles={[roles.SUPER_ADMIN,roles.QA,roles.SUPPORT]}>
                <InvestigationForm {...props} />
            </RoleBasedFormSection>
        </div>
    );
}
