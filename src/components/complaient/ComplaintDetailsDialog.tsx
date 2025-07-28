// components/complaint-details-dialog.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { Complaint } from "@/lib/api/types/complaints";

interface ComplaintDetailsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    complaint: Complaint;
}

export function ComplaintDetailsDialog({
                                           open,
                                           onOpenChange,
                                           complaint,
                                       }: ComplaintDetailsDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[95vw] h-[95vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex justify-between items-center">
                        <DialogTitle className="text-2xl">
                            Complaint #{complaint.complaint_number}
                        </DialogTitle>
                        {/*<Button*/}
                        {/*    variant="ghost"*/}
                        {/*    size="icon"*/}
                        {/*    onClick={() => onOpenChange(false)}*/}
                        {/*>*/}
                        {/*    <X className="h-5 w-5" />*/}
                        {/*</Button>*/}
                    </div>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Customer Section */}
                    <DetailSection title="Customer Information">
                        <DetailItem label="Name" value={complaint.customer.name} />
                        <DetailItem label="Company" value={complaint.customer.company} />
                        <DetailItem label="Contact" value={complaint.customer.contact_number} />
                        <DetailItem label="Email" value={complaint.customer.email} />
                    </DetailSection>

                    {/* Product Section */}
                    <DetailSection title="Product Details">
                        <DetailItem label="Model" value={complaint.product_details.model} />
                        <DetailItem
                            label="Serial Number"
                            value={complaint.product_details.serial_number}
                        />
                        <DetailItem
                            label="Purchase Date"
                            value={new Date(complaint.product_details.purchase_date).toLocaleDateString()}
                        />
                    </DetailSection>

                    {/* Complaint Type */}
                    <DetailSection title="Complaint Type">
                        <DetailItem label="Type" value={complaint.complaint_type.name} />
                        {complaint.complaint_type.description &&
                        <DetailItem
                            label="Description"
                            value={complaint.complaint_type.description}
                        />}
                    </DetailSection>

                    {/* Issue Details */}
                    <DetailSection title="Issue Details">
                        <DetailItem
                            label="Description"
                            value={complaint.issue_details.description}
                        />
                        <DetailItem
                            label="Problem Start Date"
                            value={new Date(complaint.issue_details.problem_start_date).toLocaleDateString()}
                        />
                        <DetailItem
                            label="Occurred Before"
                            value={complaint.issue_details.occurred_before}
                        />
                        {complaint.issue_details.replication_steps &&
                        <DetailItem
                            label="Replication Steps"
                            value={complaint.issue_details.replication_steps}
                        />}
                    </DetailSection>

                    {/* Customer Impact */}
                    <DetailSection title="Customer Impact">
                        <p className="text-sm text-muted-foreground">
                            {complaint.customer_impact}
                        </p>
                    </DetailSection>

                    {/* Preferred Resolution */}
                    <DetailSection title="Preferred Resolution">
                        <DetailItem
                            label="Method"
                            value={complaint.preferred_resolution_method.name}
                        />
                        {complaint.preferred_resolution_method.description &&
                        <DetailItem
                            label="Description"
                            value={complaint.preferred_resolution_method.description}
                        />}
                    </DetailSection>

                    {/* Submission Details */}
                    <DetailSection title="Submission Details">
                        <DetailItem
                            label="Submitted"
                            value={new Date(complaint.submission_date).toLocaleString()}
                        />
                        <DetailItem
                            label="Last Updated"
                            value={new Date(complaint.updated_on).toLocaleString()}
                        />
                    </DetailSection>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// Helper components
function DetailSection({
                           title,
                           children,
                       }: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div className="rounded-lg border p-4">
            <h3 className="font-semibold mb-3">{title}</h3>
            <div className="space-y-3">{children}</div>
        </div>
    );
}

function DetailItem({
                        label,
                        value,
                    }: {
    label: string;
    value: string | undefined;
}) {
    return (
        <div className="grid grid-cols-3 gap-2">
            <span className="text-sm text-muted-foreground col-span-1">{label}</span>
            <span className="text-sm font-medium col-span-2">
        {value || "Not provided"}
      </span>
        </div>
    );
}