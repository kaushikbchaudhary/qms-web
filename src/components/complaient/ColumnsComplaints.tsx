// columns.ts
import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, MoreHorizontal } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
//
export type Complaint = {
    _id: string
    complaint_number: number
    submission_date: string
    customer: {
        name: string
        company: string
        contact_number: string
        email: string
    }
    product_details: {
        model: string
        serial_number: string
        purchase_date: string
    }
    complaint_type: {
        name: string
        description: string | null
    }
    issue_details: {
        description: string
        problem_start_date: string
        occurred_before: string
    }
    preferred_resolution_method: {
        name: string
    }
    attachments: string[]
}

// export const ColumnsComplaints: ColumnDef<Complaint>[] = [
//     {
//         accessorKey: "complaint_number",
//         header: "Complaint #",
//         cell: ({ row }) => (
//             <Link href={`/dashboard/complaints/${row.original._id}`} className="font-medium text-primary hover:underline">
//                 {row.getValue("complaint_number")}
//             </Link>
//         ),
//     },
//     {
//         accessorKey: "submission_date",
//         header: "Submission Date",
//         cell: ({ row }) => {
//             const date = new Date(row.getValue("submission_date"))
//             return date.toLocaleDateString()
//         },
//     },
//     {
//         accessorKey: "customer.name",
//         header: "Customer Name",
//     },
//     {
//         accessorKey: "customer.company",
//         header: "Company",
//     },
//     {
//         accessorKey: "product_details.model",
//         header: "Product Model",
//     },
//     {
//         accessorKey: "product_details.serial_number",
//         header: "Serial Number",
//     },
//     {
//         accessorKey: "complaint_type.name",
//         header: "Complaint Type",
//         cell: ({ row }) => {
//             const type = row.original.complaint_type
//             return (
//                 <div className="flex flex-col">
//                     <span className="font-medium">{type.name}</span>
//                     {type.description && (
//                         <span className="text-xs text-muted-foreground">{type.description}</span>
//                     )}
//                 </div>
//             )
//         },
//     },
//     {
//         accessorKey: "issue_details.description",
//         header: "Issue Description",
//         cell: ({ row }) => {
//             const issue = row.original.issue_details
//             return (
//                 <div className="flex flex-col">
//                     <span className="line-clamp-1">{issue.description}</span>
//                     <span className="text-xs text-muted-foreground">
//             Started: {new Date(issue.problem_start_date).toLocaleDateString()}
//           </span>
//                 </div>
//             )
//         },
//     },
//     {
//         accessorKey: "preferred_resolution_method.name",
//         header: "Resolution Method",
//         cell: ({ row }) => {
//             const method = row.original.preferred_resolution_method
//             return <Badge variant="outline">{method.name}</Badge>
//         },
//     },
//     {
//         accessorKey: "attachments",
//         header: "Attachments",
//         cell: ({ row }) => {
//             const attachments = row.original.attachments
//             return attachments.length > 0 ? (
//                 <Badge variant="secondary">{attachments.length} files</Badge>
//             ) : (
//                 <span className="text-muted-foreground">None</span>
//             )
//         },
//     },
//     {
//         id: "actions",
//         cell: ({ row }) => {
//             const complaint = row.original
//
//             return (
//                 <DropdownMenu>
//                     <DropdownMenuTrigger asChild>
//                         <Button variant="ghost" className="h-8 w-8 p-0">
//                             <span className="sr-only">Open menu</span>
//                             <MoreHorizontal className="h-4 w-4" />
//                         </Button>
//                     </DropdownMenuTrigger>
//                     <DropdownMenuContent align="end">
//                         <DropdownMenuLabel>Actions</DropdownMenuLabel>
//                         <DropdownMenuItem asChild>
//                             <Link href={`/dashboard/complaints/${complaint._id}`}>View details</Link>
//                         </DropdownMenuItem>
//                         <DropdownMenuItem
//                             onClick={() => navigator.clipboard.writeText(complaint.complaint_number.toString())}
//                         >
//                             Copy complaint number
//                         </DropdownMenuItem>
//                         <DropdownMenuItem>Assign to technician</DropdownMenuItem>
//                         <DropdownMenuItem>Change status</DropdownMenuItem>
//                     </DropdownMenuContent>
//                 </DropdownMenu>
//             )
//         },
//     },
// ]

export const ColumnsComplaints: ColumnDef<Complaint>[] = [
    {
        accessorKey: "complaint_number",
        header: "Complaint #",
        cell: ({ row }) => (
            <Link href={`/dashboard/complaints/${row.original._id}`} className="font-medium text-primary hover:underline">
                {row.getValue("complaint_number")}
            </Link>
        ),
    },
    {
        accessorKey: "submission_date",
        header: "Submission Date",
        cell: ({ row }) => {
            const date = new Date(row.getValue("submission_date"))
            return date.toLocaleDateString()
        },
    },
    {
        accessorKey: "customer.name",
        header: "Customer Name",
    },
    {
        accessorKey: "customer.company",
        header: "Company",
    },
    {
        accessorKey: "customer.contact_number",
        header: "Contact Number",
    },
    {
        accessorKey: "customer.email",
        header: "Email",
        cell: ({ row }) => {
            const email = row.original.customer.email
            return (
                <a href={`mailto:${email}`} className="text-primary hover:underline">
                    {email}
                </a>
            )
        },
    },
    {
        accessorKey: "product_details.model",
        header: "Product Model",
    },
    // {
    //     accessorKey: "product_details.unique_identifier",
    //     header: "Unique ID",
    // },
    {
        accessorKey: "product_details.serial_number",
        header: "Serial Number",
    },
    {
        accessorKey: "product_details.purchase_date",
        header: "Purchase Date",
        cell: ({ row }) => {
            const date = row.original.product_details.purchase_date
            return date ? new Date(date).toLocaleDateString() : "-"
        },
    },
    {
        accessorKey: "complaint_type.name",
        header: "Complaint Type",
        cell: ({ row }) => {
            const type = row.original.complaint_type
            return (
                <div className="flex flex-col">
                    <span className="font-medium">{type.name}</span>
                    {type.description && (
                        <span className="text-xs text-muted-foreground">{type.description}</span>
                    )}
                </div>
            )
        },
    },
    {
        accessorKey: "issue_details.description",
        header: "Issue Description",
        cell: ({ row }) => {
            const issue = row.original.issue_details
            return (
                <div className="flex flex-col">
                    <span className="line-clamp-1">{issue.description}</span>
                    <span className="text-xs text-muted-foreground">
                        Started: {new Date(issue.problem_start_date).toLocaleDateString()}
                    </span>
                    {issue.occurred_before && (
                        <span className="text-xs text-muted-foreground">
                            Occurred before: {issue.occurred_before}
                        </span>
                    )}
                </div>
            )
        },
    },
    // {
    //     accessorKey: "previous_contact.reported_before",
    //     header: "Previously Reported",
    //     cell: ({ row }) => {
    //         const prev = row.original.previous_contact
    //         return prev.reported_before === "yes" ? (
    //             <div className="flex flex-col">
    //                 <span>Yes</span>
    //                 <span className="text-xs text-muted-foreground">
    //                     Ref: {prev.reference_number}
    //                 </span>
    //                 <span className="text-xs text-muted-foreground">
    //                     Contacted: {prev.person_contacted}
    //                 </span>
    //                 <span className="text-xs text-muted-foreground">
    //                     Date: {new Date(prev.contact_date).toLocaleDateString()}
    //                 </span>
    //             </div>
    //         ) : (
    //             <span>No</span>
    //         )
    //     },
    // },
    // {
    //     accessorKey: "customer_actions.troubleshooting_done",
    //     header: "Troubleshooting",
    //     cell: ({ row }) => {
    //         const actions = row.original.customer_actions
    //         return actions.troubleshooting_done === "yes" ? (
    //             <div className="flex flex-col">
    //                 <span>Yes</span>
    //                 {actions.troubleshooting_description && (
    //                     <span className="text-xs text-muted-foreground line-clamp-1">
    //                         {actions.troubleshooting_description}
    //                     </span>
    //                 )}
    //             </div>
    //         ) : (
    //             <span>No</span>
    //         )
    //     },
    // },
    {
        accessorKey: "preferred_resolution_method.name",
        header: "Resolution Method",
        cell: ({ row }) => {
            const method = row.original.preferred_resolution_method
            return <Badge variant="outline">{method.name}</Badge>
        },
    },
    {
        accessorKey: "customer_impact",
        header: "Customer Impact",
        cell: ({ row }) => {
            const impact:string = row.getValue("customer_impact")
            return (
                <div className="line-clamp-2">
                    {impact || "-"}
                </div>
            )
        },
    },
    {
        accessorKey: "attachments",
        header: "Attachments",
        cell: ({ row }) => {
            const attachments = row.original.attachments
            return attachments.length > 0 ? (
                <Badge variant="secondary">{attachments.length} files</Badge>
            ) : (
                <span className="text-muted-foreground">None</span>
            )
        },
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const complaint = row.original

            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                            <Link href={`/dashboard/complaints/${complaint._id}`}>View details</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => navigator.clipboard.writeText(complaint.complaint_number.toString())}
                        >
                            Copy complaint number
                        </DropdownMenuItem>
                        <DropdownMenuItem>Assign to technician</DropdownMenuItem>
                        <DropdownMenuItem>Change status</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        },
    },
]