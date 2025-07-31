import CreateUserPage from "@/components/users/create-user";
import {UserList} from "@/components/users/User-list";

export default function page() {
    return (
        <div className="flex flex-col items-center justify-center">
            <UserList/>
            <h1 className="text-2xl font-bold mb-4">create user</h1>
            <CreateUserPage/>
        </div>
    );
}