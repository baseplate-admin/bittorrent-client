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
import {
    PlayIcon,
    StopCircle,
    PlayCircle,
    Trash2,
    Pencil,
    FolderOpen,
    Tag,
    Folder,
    RefreshCcw,
    UploadCloud,
    Plus,
} from "lucide-react";
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

    const handlePauseButtonClick = () => {
        setTorrentPauseQueue((prev) => {
            if (!prev) return [data.info_hash];
            return [...prev, data.info_hash];
        });
    };
    const handleResumeButtonClick = () => {
        setTorrentResumeQueue((prev) => {
            if (!prev) return [data.info_hash];
            return [...prev, data.info_hash];
        });
    };

    const handleRemoveButtonClick = () => {
        setTorrentRemoveQueue((prev) => {
            if (!prev) return [data.info_hash];
            return [...prev, data.info_hash];
        });
    };

    return (
        <ContextMenu>
            <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
            <ContextMenuContent className="w-68">
                <ContextMenuItem
                    disabled={!data.paused}
                    onClick={handleResumeButtonClick}
                >
                    <PlayIcon className="mr-2 h-4 w-4" />
                    Resume
                </ContextMenuItem>
                <ContextMenuItem
                    onClick={handlePauseButtonClick}
                    disabled={data.paused}
                >
                    <StopCircle className="mr-2 h-4 w-4" />
                    Pause
                </ContextMenuItem>
                <ContextMenuItem>
                    <PlayCircle className="mr-2 h-4 w-4" />
                    Force Start
                </ContextMenuItem>
                <ContextMenuItem onClick={handleRemoveButtonClick}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove
                </ContextMenuItem>
                <ContextMenuItem>
                    <Pencil className="mr-2 h-4 w-4" />
                    Rename
                </ContextMenuItem>

                <ContextMenuSeparator />

                <ContextMenuItem>
                    <FolderOpen className="mr-2 h-4 w-4" />
                    Set Location
                </ContextMenuItem>

                <ContextMenuSeparator />

                <ContextMenuSub>
                    <ContextMenuSubTrigger>
                        <Tag className="mr-4 h-4 w-4" />
                        Tags
                    </ContextMenuSubTrigger>
                    <ContextMenuSubContent className="w-44">
                        <ContextMenuItem>
                            <Plus className="mr-2 h-4 w-4" />
                            Add
                        </ContextMenuItem>
                        <ContextMenuItem>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                        </ContextMenuItem>
                        <ContextMenuItem>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove All
                        </ContextMenuItem>
                    </ContextMenuSubContent>
                </ContextMenuSub>

                <ContextMenuSub>
                    <ContextMenuSubTrigger>
                        <Folder className="mr-4 h-4 w-4" />
                        Category
                    </ContextMenuSubTrigger>
                    <ContextMenuSubContent className="w-44">
                        <ContextMenuItem>
                            <Plus className="mr-2 h-4 w-4" />
                            Add
                        </ContextMenuItem>
                        <ContextMenuItem>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                        </ContextMenuItem>
                        <ContextMenuItem>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove All
                        </ContextMenuItem>
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

                <ContextMenuItem>
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    Force Recheck
                </ContextMenuItem>
                <ContextMenuItem>
                    <UploadCloud className="mr-2 h-4 w-4" />
                    Force Reannounce
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
