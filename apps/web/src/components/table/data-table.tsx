'use client';

import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
    SortingState,
    getSortedRowModel,
} from '@tanstack/react-table';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

import {
    ContextMenu,
    ContextMenuTrigger,
    ContextMenuContent,
    ContextMenuItem,
} from '@/components/ui/context-menu';

import { Fragment, useState } from 'react';
import { Torrent } from '@/types/Torrent';
import {
    torrentPauseQueueAtom,
    torrentResumeQueueAtom,
    torrentRemoveQueueAtom,
} from '@/atoms/torrent';
import { useSetAtom } from 'jotai';

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
}

function renderRowContextMenu<T>(rowData: T, children: React.ReactNode) {
    const data = rowData as Torrent;

    const setTorrentPauseQueue = useSetAtom(torrentPauseQueueAtom);
    const setTorrentResumeQueue = useSetAtom(torrentResumeQueueAtom);
    const setTorrentRemoveQueue = useSetAtom(torrentRemoveQueueAtom);

    const handleDeleteButtonClick = () => {
        setTorrentRemoveQueue((prev) => [...prev, data.infoHash]);
    };

    return (
        <ContextMenu>
            <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
            <ContextMenuContent className="w-48">
                <ContextMenuItem onClick={() => console.log('View', rowData)}>
                    View
                </ContextMenuItem>
                <ContextMenuItem onClick={() => console.log('Edit', rowData)}>
                    Edit
                </ContextMenuItem>
                <ContextMenuItem onClick={handleDeleteButtonClick}>
                    Delete
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    );
}

export function DataTable<TData, TValue>({
    columns,
    data,
}: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = useState<SortingState>([]);

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        onSortingChange: setSorting,
        columnResizeMode: 'onChange',
        getSortedRowModel: getSortedRowModel(),
        state: {
            sorting,
        },
    });

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                                <TableHead
                                    key={header.id}
                                    className="text-center"
                                >
                                    {header.isPlaceholder
                                        ? null
                                        : flexRender(
                                              header.column.columnDef.header,
                                              header.getContext()
                                          )}
                                </TableHead>
                            ))}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row) => (
                            <Fragment key={row.id}>
                                {renderRowContextMenu(
                                    row.original as Torrent,
                                    <TableRow
                                        data-state={
                                            row.getIsSelected() && 'selected'
                                        }
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id}>
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext()
                                                )}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                )}
                            </Fragment>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell
                                colSpan={columns.length}
                                className="h-24 text-center"
                            >
                                No results.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
