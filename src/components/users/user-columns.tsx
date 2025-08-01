"use client";
import { ColumnDef } from "@tanstack/react-table";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export const userColumns: ColumnDef<any>[] = [
    {
        accessorKey: "firstName",
        header: "First Name",
    },
    {
        accessorKey: "lastName",
        header: "Last Name",
    },
    {
        accessorKey: "emailId",
        header: "Email",
    },
    {
        accessorKey: "contact",
        header: "Contact",
    },
    {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }) => (
            <div className="flex gap-1 flex-wrap">
                {(Array.isArray(row.original.role) ? row.original.role : [row.original.role]).map((role:any) => (
                    <span
                        key={role}
                        className="px-2 py-1 bg-secondary rounded-md text-xs"
                    >
            {role}
          </span>
                ))}
            </div>
        ),
        filterFn: (row, columnId, filterValues) => {
            if (!filterValues || filterValues.length === 0) return true;
            const rowRoles = Array.isArray(row.original.role) ? row.original.role : [row.original.role];
            return filterValues.some((val: string) => rowRoles.includes(val));
        },
    },
    {
        accessorKey: "isVerified",
        header: "Verified",
        cell: ({ row }) => (
            row.original.isVerified ?
                <Check className="h-4 w-4 text-green-500" /> :
                <X className="h-4 w-4 text-red-500" />
        ),
    },
    {
        accessorKey: "createdAt",
        header: "Created At",
        cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
    },
    {
        id: "actions",
        cell: ({ row }) => (
            <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                    window.location.href = '/admin/users/edit-user/' + row.original._id;
                }}
            >
                Edit
            </Button>
        ),
    },
];