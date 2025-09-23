import CreateUserPage from "@/components/users/create-user";
import { UserList } from "@/components/users/User-list";

export default function AdminUsersPage() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-semibold tracking-tight">User management</h1>
                <p className="text-sm text-muted-foreground">
                    Review existing accounts and onboard new team members with the correct role assignments.
                </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
                <div className="space-y-4">
                    <UserList />
                </div>
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Invite a new user</h2>
                    <CreateUserPage />
                </div>
            </div>
        </div>
    );
}
