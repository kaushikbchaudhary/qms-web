import {ComplaintForm} from "@/components/forms/complaint-form";

export default function page() {
    return (
        <div className="container py-8 space-y-4">
            <h1 className="text-2xl font-bold">New Complaint</h1>
            <ComplaintForm />
        </div>
    );
}
