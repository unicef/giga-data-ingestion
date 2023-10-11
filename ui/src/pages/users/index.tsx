import { Button } from "antd";

export default function Users() {
  return (
    <div className="container flex flex-col gap-4 py-6">
      <div className="flex justify-between">
        <h2 className="text-[23px]">User Management</h2>
        <Button type="primary" className="bg-primary">
          Add User
        </Button>
      </div>
    </div>
  );
}
