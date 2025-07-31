// components/complaint-details-dialog.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { Complaint } from "@/lib/api/types/complaints";

export function ComplaintDetailsDialog({
                                           open,
                                           onOpenChange,
                                           complaint,
                                       }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    complaint: any;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[95vw] h-[95vh] sm:max-w-[85vw] overflow-y-auto">
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

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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

                    {/* Long text sections with better handling */}
                    <DetailSection title="Issue Description" className="lg:col-span-2">
                        <div className="p-3 bg-muted/50 rounded-md">
                            <p className="whitespace-pre-wrap break-words">
                                {complaint.issue_details.description}
                            </p>
                        </div>
                    </DetailSection>

                    <DetailSection title="Customer Impact" className="lg:col-span-2">
                        <div className="p-3 bg-muted/50 rounded-md">
                            <p className="whitespace-pre-wrap break-words">
                                {complaint.customer_impact}
                            </p>
                        </div>
                    </DetailSection>

                    {/* Other sections... */}
                </div>
            </DialogContent>
        </Dialog>
    );
}

// Enhanced DetailSection component
function DetailSection({
                           title,
                           children,
                           className = "",
                       }: {
    title: string;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={`rounded-lg border p-4 ${className}`}>
            <h3 className="font-semibold mb-3">{title}</h3>
            <div className="space-y-3">{children}</div>
        </div>
    );
}

// Enhanced DetailItem component with better text handling
function DetailItem({
                        label,
                        value,
                    }: {
    label: string;
    value: string | undefined;
}) {
    return (
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
      <span className="text-sm text-muted-foreground min-w-[120px] max-w-[200px]">
        {label}
      </span>
            <span className="text-sm font-medium flex-1 break-all">
        {value || "Not provided"}
      </span>
        </div>
    );
}