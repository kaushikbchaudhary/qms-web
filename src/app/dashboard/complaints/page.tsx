import {ComplaintsTable} from "@/components/complaient/ComplaintTable";

export default function page() {
  return (
    <div className="flex flex-col items-center justify-center">
      {/*<h1 className="text-2xl font-bold mb-4">Complaints List</h1>*/}
        <ComplaintsTable/>
    </div>
  );
}