// components/RoleBasedFormSection.tsx
"use client"

import { ReactNode } from "react"
import {useAuthStore} from "@/stores/authStore";

export function RoleBasedFormSection({
                                         children,
                                         requiredRoles,
                                     }: {
    children: ReactNode
    requiredRoles: string[]
}) {
    const userData = useAuthStore.getState().user;

    if (!userData?.role?.some(role => requiredRoles.includes(role))) {
        return (
            <div className="p-4 border rounded-lg bg-gray-50 text-gray-500 text-center">
                You don't have permission to view this section
            </div>
        )
    }

    return <>{children}</>
}
