"use client";

import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
    SortingState,
    getSortedRowModel,
} from "@tanstack/react-table";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

import {
    ContextMenu,
    ContextMenuCheckboxItem,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuSub,
    ContextMenuSubContent,
    ContextMenuSubTrigger,
    ContextMenuTrigger,
} from "@/components/ui/context-menu";

import { Fragment, useState } from "react";
import {
    torrentPauseQueueAtom,
    torrentResumeQueueAtom,
    torrentRemoveQueueAtom,
} from "@/atoms/torrent";
import { useSetAtom } from "jotai";
import { TorrentInfo } from "@/types/socket/torrent_info";

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
}

function RowContextMenu({
    rowData,
    children,
}: Readonly<{
    rowData: TorrentInfo;
    children: React.ReactNode;
}>) {
    const data = rowData as TorrentInfo;

    const setTorrentPauseQueue = useSetAtom(torrentPauseQueueAtom);
    const setTorrentResumeQueue = useSetAtom(torrentResumeQueueAtom);
    const setTorrentRemoveQueue = useSetAtom(torrentRemoveQueueAtom);

    const handleDeleteButtonClick = () => {
        setTorrentRemoveQueue((prev) => [...prev, data.info_hash]);
    };

    return (
        <ContextMenu>
            <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
            <ContextMenuContent className="w-68">
                <ContextMenuItem inset>Start</ContextMenuItem>
                <ContextMenuItem inset disabled>
                    Stop
                </ContextMenuItem>
                <ContextMenuItem inset>Force Start</ContextMenuItem>
                <ContextMenuItem inset>Remove</ContextMenuItem>
                <ContextMenuItem inset>Rename</ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem inset>Set Location</ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuSub>
                    <ContextMenuSubTrigger inset>Tags</ContextMenuSubTrigger>
                    <ContextMenuSubContent className="w-44">
                        <ContextMenuItem>Add</ContextMenuItem>
                        <ContextMenuItem>Edit</ContextMenuItem>
                        <ContextMenuItem>Remove All</ContextMenuItem>
                    </ContextMenuSubContent>
                </ContextMenuSub>
                <ContextMenuSub>
                    <ContextMenuSubTrigger inset>
                        Category
                    </ContextMenuSubTrigger>
                    <ContextMenuSubContent className="w-44">
                        <ContextMenuItem>Add</ContextMenuItem>
                        <ContextMenuItem>Edit</ContextMenuItem>
                        <ContextMenuItem>Remove All</ContextMenuItem>
                    </ContextMenuSubContent>
                </ContextMenuSub>
                <ContextMenuSeparator />
                <ContextMenuCheckboxItem>
                    Automatic Torrent Management
                </ContextMenuCheckboxItem>
                <ContextMenuCheckboxItem>
                    Super Seeding Mode
                </ContextMenuCheckboxItem>
                <ContextMenuSeparator />
                <ContextMenuItem inset>Force Recheck</ContextMenuItem>
                <ContextMenuItem inset>Force Reannounce</ContextMenuItem>
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
        columnResizeMode: "onChange",
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
                                              header.getContext(),
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
                                <RowContextMenu
                                    rowData={row.original as TorrentInfo}
                                >
                                    <TableRow
                                        data-state={
                                            row.getIsSelected() && "selected"
                                        }
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id}>
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext(),
                                                )}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                </RowContextMenu>
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
