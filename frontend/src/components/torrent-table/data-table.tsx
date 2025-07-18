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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Fragment, useEffect, useRef, useState } from "react";
import {
    torrentPauseQueueAtom,
    torrentResumeQueueAtom,
    torrentRemoveQueueAtom,
} from "@/atoms/torrent";
import { selectedRowAtom } from "@/atoms/table";
import { useAtom, useSetAtom } from "jotai";
import { TorrentInfo } from "@/types/socket/torrent_info";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";
import { Button } from "../ui/button";

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
}

function RemoveTorrentDialog({
    open,
    setOpen,
    name,
    handleButtonClick,
}: {
    open: boolean;
    setOpen: (open: boolean) => void;
    name: string;
    handleButtonClick: ({
        setOpen,
        remove_data,
    }: {
        setOpen: (open: boolean) => void;
        remove_data: boolean;
    }) => void;
}) {
    const [removeData, setRemoveData] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Remove Torrent</DialogTitle>
                    <DialogDescription asChild>
                        <div className="mt-4 flex flex-col gap-4">
                            <p>
                                Are you sure you want to remove "{name}" from
                                the transfer list?
                            </p>
                            <div className="flex items-center justify-start gap-3 px-1">
                                <Checkbox
                                    id="remove-content-file"
                                    checked={removeData}
                                    onCheckedChange={(checked) => {
                                        setRemoveData(!!checked);
                                    }}
                                />
                                <Label
                                    htmlFor="remove-content-file"
                                    className="text-sm italic"
                                >
                                    Also remove the content files
                                </Label>
                            </div>
                        </div>
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() =>
                            handleButtonClick({
                                setOpen,
                                remove_data: removeData,
                            })
                        }
                    >
                        Okay
                    </Button>
                    <DialogTrigger asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogTrigger>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function RowContextMenu({
    rowData,
    children,
}: Readonly<{
    rowData: TorrentInfo;
    children: React.ReactNode;
}>) {
    const data = rowData;

    const [removedDialogOpen, setRemovedDialogOpen] = useState(false);

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

    const handleRemoveButtonClick = ({
        setOpen,
        remove_data,
    }: {
        setOpen: (open: boolean) => void;
        remove_data: boolean;
    }) => {
        setTorrentRemoveQueue((prev) => {
            const object = {
                info_hash: data.info_hash,
                remove_data: remove_data,
            };
            if (!prev) return [object];
            return [...prev, object];
        });
        setOpen(false);
    };

    return (
        <>
            {/* Dialogues */}
            <RemoveTorrentDialog
                open={removedDialogOpen}
                setOpen={setRemovedDialogOpen}
                name={data.name}
                handleButtonClick={handleRemoveButtonClick}
            ></RemoveTorrentDialog>

            {/* Context menu  */}
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
                    <ContextMenuItem onClick={() => setRemovedDialogOpen(true)}>
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
        </>
    );
}

export function DataTable<TData, TValue>({
    columns,
    data,
}: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [rowSelection, setRowSelection] = useAtom(selectedRowAtom);

    const tableRef = useRef<HTMLTableElement>(null);

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        onSortingChange: setSorting,
        state: {
            sorting,
            rowSelection,
        },
        onRowSelectionChange: setRowSelection,
        columnResizeMode: "onChange",
    });

    const handleRowClick = (rowId: string) => {
        if (!rowSelection[rowId]) {
            setRowSelection((prev) => ({
                ...prev,
                [rowId]: true,
            }));
        }
    };

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                tableRef.current &&
                !tableRef.current.contains(event.target as Node)
            ) {
                setRowSelection({});
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [setRowSelection]);

    return (
        <div className="h-full rounded-md border">
            <Table ref={tableRef}>
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
                    {table.getRowModel().rows.length ? (
                        table.getRowModel().rows.map((row) => {
                            const isSelected = !!rowSelection[row.id];

                            return (
                                <Fragment key={row.id}>
                                    <RowContextMenu
                                        rowData={row.original as TorrentInfo}
                                    >
                                        <TableRow
                                            onClick={() =>
                                                handleRowClick(row.id)
                                            }
                                            data-state={
                                                isSelected
                                                    ? "selected"
                                                    : undefined
                                            }
                                            className={
                                                isSelected ? "bg-blue-100" : ""
                                            }
                                        >
                                            {row
                                                .getVisibleCells()
                                                .map((cell) => (
                                                    <TableCell key={cell.id}>
                                                        {flexRender(
                                                            cell.column
                                                                .columnDef.cell,
                                                            cell.getContext(),
                                                        )}
                                                    </TableCell>
                                                ))}
                                        </TableRow>
                                    </RowContextMenu>
                                </Fragment>
                            );
                        })
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
