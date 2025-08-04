// app/complaints/[id]/page.tsx
import { notFound } from "next/navigation"
import { InvestigationForm } from "@/components/forms/InvestigationForm"
import {ComplaintStatusBadge} from "@/components/complaient/ComplaintStatusBadge";
import {StatusTransitionDropdown} from "@/components/complaient/StatusTransitionDropdown";
import {useAuthStore} from "@/stores/authStore";
import {useComplaintWithWorkflow} from "@/hooks/api/useComplaints";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";

export default function ComplaintDetail({ params }: { params: { id: string } }) {
    const userData = useAuthStore.getState().user;
    // const complaint = await fetchComplaint(params.id) // Implement your data fetching
    const { data: complaint, isLoading }:any = useComplaintWithWorkflow(params.id);

    if (!complaint) return notFound()

    return (
        <div className="container mx-auto py-8">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Complaint #{complaint?.complaint_number || '-'}</h1>
                    <div className="mt-2">
                        <ComplaintStatusBadge status={complaint.status} />
                    </div>
                </div>
                <StatusTransitionDropdown
                    complaintId={complaint._id}
                    currentStatus={complaint.status}
                    userRole={userData?.role || []}
                />
            </div>

            <Tabs defaultValue="details">
                <TabsList>
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="investigation">Investigation</TabsTrigger>
                    <TabsTrigger value="communication">Communication</TabsTrigger>
                </TabsList>

                {/*<TabsContent value="details">*/}
                {/*    <ComplaintDetails complaint={complaint} />*/}
                {/*</TabsContent>*/}

                <TabsContent value="investigation">
                    {userData && userData.role.includes("INVESTIGATOR") && (
                        <InvestigationForm
                            complaintId={complaint._id!}
                            defaultValues={complaint.investigation!}
                            onSuccess={() => window.location.reload()}
                        />
                    )}
                </TabsContent>
            </Tabs>
        </div>
    )
}