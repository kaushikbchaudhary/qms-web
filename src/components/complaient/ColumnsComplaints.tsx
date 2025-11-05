// columns.ts
import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import {ArrowUpDown, Eye, MoreHorizontal} from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import {useState} from "react";
import AttachmentViewer from "@/components/complaient/AttachmentViewer";
import {ComplaintDetailsDialog} from "@/components/complaient/ComplaintDetailsDialog";
import {useRouter} from "next/navigation";
//
const TruncatedText = ({
                           text,
                           maxLength = 20,
                           maxWidth = 300,
                           maxHeight = 500
                       }: {
    text: string;
    maxLength?: number;
    maxWidth?: number;
    maxHeight?: number;
}) => {
    const [isExpanded, setIsExpanded] = useState(false);

    if (!text) return <span className="text-muted-foreground">-</span>;

    return (
        <div className="flex flex-col gap-1">
            {/* Truncated view */}
            <div
                className={`transition-all duration-200 ${isExpanded ? 'hidden' : 'block'}`}
                style={{ maxWidth: `${maxWidth}px` }}
            >
        <span className="truncate">
          {text.length > maxLength ? `${text.substring(0, maxLength)}...` : text}
        </span>
            </div>

            {/* Expanded card view */}
            {/*className={`transition-all duration-200 ${isExpanded ? 'whitespace-normal' : 'whitespace-nowrap'}`}*/}
            {/**/}
            {isExpanded && (
                <div
                    className="relative p-3  rounded-lg border border-gray-200  shadow-sm transition-all duration-300"
                    style={{
                        maxWidth: `${maxWidth}px`,
                        height:'auto',
                        maxHeight: `${maxHeight}px`,
                        overflowY: 'auto'
                    }}
                >
                    <div className="break-words text-sm whitespace-normal">
                        {text}
                    </div>
                    <div className="absolute -bottom-2 right-2">
                        <div className=" px-1">
                            <button
                                onClick={() => setIsExpanded(false)}
                                className="text-primary hover:text-primary-dark text-xs flex items-center gap-1 focus:outline-none"
                            >
                                <span>Collapse</span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="m18 15-6-6-6 6"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Show more/less button */}
            {text.length > maxLength && (
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-primary hover:text-primary-dark focus:outline-none text-xs flex items-center gap-1 transition-colors duration-200"
                >
                    {isExpanded ? null : (
                        <>
                            <span>Show more</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="m6 9 6 6 6-6"/>
                            </svg>
                        </>
                    )}
                </button>
            )}
        </div>
    );
};


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
        model?: string
        serial_number?: string
        purchase_date?: string
    }
    complaint_type: {
        name: string
        description: string | null
    }
    issue_details: {
        description?: string
        problem_start_date?: string
        occurred_before?: string
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
        header: "# Complaint",
        // fixed: "left",
        cell: ({ row }) => (
            <Link href={`/dashboard/complaints/${row.original._id}`} className="font-medium text-primary hover:underline">
                {row.getValue("complaint_number")}
            </Link>
        ),
        meta: {
            className: "sticky left-0 z-[49] bg-background", // Tailwind sticky styling
        },
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
                        <TruncatedText text={type.description} />
                        // <span className="text-xs text-muted-foreground">{type.description}</span>
                    )}
                </div>
            )
        },
    },
    {
        accessorKey: "issue_details.description",
        header: "Issue Description",
        cell: ({ row }) => {
            const issue = row.original.issue_details ?? {}
            return (
                <div className="flex flex-col">
                    <TruncatedText text={issue.description ?? ''} maxLength={30} />
                    {/*<span className="line-clamp-1">{issue.description}</span>*/}
                    <span className="text-xs text-muted-foreground">
                        Started: {issue.problem_start_date ? new Date(issue.problem_start_date).toLocaleDateString() : '-'}
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
            return impact ? <TruncatedText text={impact} /> : <span>-</span>;
            // return (
            //     <div className="line-clamp-2">
            //         {impact || "-"}
            //     </div>
            // )
        },
    },
    {
        accessorKey: "attachments",
        header: "Attachments",
        cell: ({ row }) => {
            const attachments = row.original.attachments
            return  <AttachmentViewer attachments={attachments} />
            // return attachments.length > 0 ? (
            //     <Badge variant="secondary">{attachments.length} files</Badge>
            // ) : (
            //     <span className="text-muted-foreground">None</span>
            // )
        },
    },
    // {
    //     accessorKey: "attachments",
    //     header: "Attachments",
    //     cell: ({ row }) => (
    //         <AttachmentViewer attachments={row.original.attachments} />
    //     ),
    // },
    {
        id: "actions",
        // fixed: "right",
        cell: ({ row }) => {
            const complaint = row.original
            // eslint-disable-next-line react-hooks/rules-of-hooks
            const [dialogOpen, setDialogOpen] = useState(false);
            // eslint-disable-next-line react-hooks/rules-of-hooks
            const [isLoading, setIsLoading] = useState(false)

            // eslint-disable-next-line react-hooks/rules-of-hooks
            const router = useRouter()
            const handleViewDetails = async () => {
                setIsLoading(true)
                // You could fetch additional data here if needed
                // setDialogOpen(true)
                router.push(`/dashboard/complaints/${complaint._id}`)
                setIsLoading(false)
            }
            return (
                    <Link href={`/dashboard/complaints/${complaint._id}`}>
                <Eye />
            </Link>
            )
            {/*    <>*/}
            {/*    <DropdownMenu>*/}
            {/*        <DropdownMenuTrigger asChild>*/}
            {/*            <Button variant="ghost" className="h-8 w-8 p-0">*/}
            {/*                <span className="sr-only">Open menu</span>*/}
            {/*                <MoreHorizontal className="h-4 w-4" />*/}
            {/*            </Button>*/}
            {/*        </DropdownMenuTrigger>*/}
            {/*        <DropdownMenuContent align="end">*/}
            {/*            <DropdownMenuLabel>Actions</DropdownMenuLabel>*/}
            {/*            <DropdownMenuItem onClick={handleViewDetails} disabled={isLoading}>*/}
            {/*                {isLoading ? 'Loading...' : 'View details'}*/}
            {/*            </DropdownMenuItem>*/}
            {/*            /!*<DropdownMenuItem asChild>*!/*/}
            {/*            /!*    <Link href={`/dashboard/complaints/${complaint._id}`}>View details</Link>*!/*/}
            {/*            /!*</DropdownMenuItem>*!/*/}
            {/*            <DropdownMenuItem*/}
            {/*                onClick={() => navigator.clipboard.writeText(complaint.complaint_number.toString())}*/}
            {/*            >*/}
            {/*                Copy complaint number*/}
            {/*            </DropdownMenuItem>*/}
            {/*            <DropdownMenuItem>Assign to technician</DropdownMenuItem>*/}
            {/*            <DropdownMenuItem>Change status</DropdownMenuItem>*/}
            {/*        </DropdownMenuContent>*/}
            {/*    </DropdownMenu>*/}

            {/*<ComplaintDetailsDialog*/}
            {/*    open={dialogOpen}*/}
            {/*    onOpenChange={setDialogOpen}*/}
            {/*    complaint={complaint}*/}
            {/*/>*/}
            {/*</>*/}
            // )
        },
        meta: {
            actionClassName: "sticky right-0 z-[49] bg-background", // Tailwind sticky styling for actions
        },
    },
]
