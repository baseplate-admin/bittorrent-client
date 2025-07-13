'use client';
import { torrentAtom } from '@/atoms/torrentAtom';
import { columns } from '@/components/table/columns';
import { DataTable } from '@/components/table/data-table';
import { useAtomValue } from 'jotai';

export default function AllPage() {
    const data = useAtomValue(torrentAtom);
    if (!data) return <div>No torrent data available</div>;
    return <DataTable columns={columns} data={data} />;
}
