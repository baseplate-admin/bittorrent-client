"use client";

import { DataTable } from "./table";
import { columns } from "./columns";
import { users } from "./data";

export default function TablePage() {
    return <DataTable columns={columns} data={users} />;
}
