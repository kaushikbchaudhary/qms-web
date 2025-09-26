// components/StatusTransitionDropdown.tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown } from "lucide-react"
import {useTransitionComplaintStatus} from "@/hooks/api/useComplaints";
import {toast} from "sonner";
import {ComplaintStatus} from "@/lib/api/types/complaints";

export function StatusTransitionDropdown({
                                             complaintId,
                                             currentStatus,
                                             userRole,
                                         }: {
    complaintId: string
    currentStatus: ComplaintStatus
    userRole: string[]
}) {

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const transitions = {
        SUBMITTED: ["UNDER_INVESTIGATION", "REJECTED"],
        UNDER_INVESTIGATION: ["RESOLVED", "REJECTED"],
        RESOLVED: ["CLOSED"],
    }[currentStatus] || []

    const { mutate, isPending } = useTransitionComplaintStatus(complaintId);
    async function handleStatusChange(newStatus: string) {
        mutate({ newStatus, comments: '' }, {
            onError: (error:any) => {
                toast.error('Failed to update status', {
                    description: error.message
                });
            }
        });
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={isPending || transitions.length === 0}>
                    Change Status <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {transitions.map((status) => (
                    <DropdownMenuItem
                        key={status}
                        onClick={() => handleStatusChange(status)}
                    >
                        Mark as {status.replace("_", " ")}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
