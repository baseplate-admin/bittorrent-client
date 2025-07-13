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
        {
            id: 'a2f3e491',
            amount: 250,
            status: 'paid',
            email: 'alice@example.com',
        },
        {
            id: 'b7c1d02e',
            amount: 75,
            status: 'failed',
            email: 'bob@example.com',
        },
        {
            id: 'c8d9f3a0',
            amount: 120,
            status: 'pending',
            email: 'charlie@example.com',
        },
        {
            id: 'd3a4b1c2',
            amount: 430,
            status: 'paid',
            email: 'diana@example.com',
        },
        {
            id: 'e4c5d6f7',
            amount: 320,
            status: 'failed',
            email: 'eve@example.com',
        },
        {
            id: 'f5e6a1b2',
            amount: 50,
            status: 'pending',
            email: 'frank@example.com',
        },
        {
            id: '01a2b3c4',
            amount: 600,
            status: 'paid',
            email: 'grace@example.com',
        },
        {
            id: '12b3c4d5',
            amount: 10,
            status: 'failed',
            email: 'henry@example.com',
        },
        {
            id: '23c4d5e6',
            amount: 990,
            status: 'paid',
            email: 'irene@example.com',
        },
        {
            id: '34d5e6f7',
            amount: 75,
            status: 'pending',
            email: 'jack@example.com',
        },
        {
            id: '45e6f701',
            amount: 150,
            status: 'paid',
            email: 'kate@example.com',
        },
        {
            id: '56f701a2',
            amount: 340,
            status: 'failed',
            email: 'leo@example.com',
        },
        {
            id: '67a2b3c4',
            amount: 80,
            status: 'pending',
            email: 'mia@example.com',
        },
        {
            id: '78b3c4d5',
            amount: 420,
            status: 'paid',
            email: 'nick@example.com',
        },
        {
            id: '89c4d5e6',
            amount: 510,
            status: 'pending',
            email: 'olivia@example.com',
        },
        {
            id: '90d5e6f7',
            amount: 25,
            status: 'failed',
            email: 'paul@example.com',
        },
        {
            id: 'a1e6f701',
            amount: 310,
            status: 'paid',
            email: 'quinn@example.com',
        },
        {
            id: 'b2f701a2',
            amount: 55,
            status: 'failed',
            email: 'rose@example.com',
        },
        {
            id: 'c3a2b3c4',
            amount: 275,
            status: 'pending',
            email: 'sam@example.com',
        },
    ];

    return (
        <DataTable columns={columns} data={data as unknown as Array<Payment>} />
    );
}
