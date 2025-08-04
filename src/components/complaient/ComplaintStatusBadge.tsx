// components/ComplaintStatusBadge.tsx
import { cn } from "@/lib/utils"

const statusMap = {
    SUBMITTED: { label: "Submitted", color: "bg-blue-100 text-blue-800" },
    UNDER_INVESTIGATION: { label: "Under Investigation", color: "bg-orange-100 text-orange-800" },
    RESOLVED: { label: "Resolved", color: "bg-green-100 text-green-800" },
    REJECTED: { label: "Rejected", color: "bg-red-100 text-red-800" },
    CLOSED: { label: "Closed", color: "bg-gray-100 text-gray-800" },
} as const

export function ComplaintStatusBadge({
                                         status,
                                         className,
                                     }: {
    status: keyof typeof statusMap
    className?: string
}) {
    return (
        <span
            className={cn(
                "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium",
                statusMap[status].color,
                className
            )}
        >
      {statusMap[status].label}
    </span>
    )
}