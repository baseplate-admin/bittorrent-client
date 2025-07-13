import Image, { type ImageProps } from 'next/image';
import { DataTable } from '@/components/table/data-table';
import { columns, Payment } from '@/components/table/columns';

export default function AllPage() {
    const data = [
        {
            id: '728ed52f',
            amount: 100,
            status: 'pending',
            email: 'm@example.com',
        },
    ];
    return (
        <DataTable columns={columns} data={data as unknown as Array<Payment>} />
    );
}
