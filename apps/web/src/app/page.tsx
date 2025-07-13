'use client';
import { torrentAtom } from '@/atoms/torrentAtom';
import { columns } from '@/components/table/columns';
import { DataTable } from '@/components/table/data-table';
import { Torrent } from '@/types/Torrent';
import { useAtomValue } from 'jotai';

export default function AllPage() {
    const data = useAtomValue(torrentAtom);
    return (
        data && (
            <DataTable
                columns={columns}
                data={data as unknown as Array<Torrent>}
            />
        )
    );
}
