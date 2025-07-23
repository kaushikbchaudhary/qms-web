// complaints-table.tsx
"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import {ComplaintQueryParams} from "@/lib/api/types/complaints";
import CustomizableTable, {useTableState} from "@/components/shared/CustomizableTable";
import {useGetComplaints} from "@/hooks/api/useComplaints";
import {ColumnsComplaints} from "@/components/complaient/ColumnsComplaints";

export function ComplaintsTable() {
    const tableState = useTableState()
    const { pagination, sorting } = tableState
    const [globalFilter, setGlobalFilter] = useState("")
    const [globalFilterFields] = useState<string[]>([
        "customer.name",
        "customer.company",
        "product_details.model",
        "product_details.serial_number",
        "complaint_type.name",
    ])
const fil = {
    page_size: 10,
    page_index: 1,
    global_value: "Performance Issue",
    global_filter: [
        "customer.name",
        "complaint_type.name"
    ],
    filters: [
        {
            field: "preferred_resolution_method.name",
            operator: "eq",
            value: "Replacement"
        }
    ],
    sort_by: "created_on",
    sort_order: -1
}
    // Prepare query params
    const queryParams: ComplaintQueryParams = {
        page_size: pagination.pageSize,
        page_index: pagination.pageIndex,
        global_value: globalFilter,
        global_filter: globalFilterFields,
        sort_by: sorting[0]?.id || "submission_date",
        sort_order: sorting[0]?.desc ? -1 : 1,
        filters: [], // Add any specific filters here
    }

    const {data, isLoading, error, refetch } = useGetComplaints(queryParams);

    console.log('data', data)
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
                <Input
                    placeholder="Search complaints..."
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    className="max-w-sm"
                />
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetch()}
                    disabled={isLoading}
                >
                    <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                    Refresh
                </Button>
            </div>

            <CustomizableTable
                columns={ColumnsComplaints}
                data={data?.list || []}
                totalItems={data?.count || 0}
                isLoading={isLoading}
                // error={error}
                options={{
                    manualPagination: true,
                    manualSorting: true,
                    manualFiltering: true,
                }}
                {...tableState}
            />
        </div>
    )
}