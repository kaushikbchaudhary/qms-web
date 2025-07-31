import CreateUserPage from "@/components/users/create-user";

export default function page() {
    return (
        <div className="flex flex-col items-center justify-center">
            <h1 className="text-2xl font-bold mb-4">create user</h1>
            <CreateUserPage/>
        </div>
    );
}