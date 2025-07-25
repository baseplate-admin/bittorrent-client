"use client";

import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
    SortingState,
    getSortedRowModel,
    ColumnSizingState,
} from "@tanstack/react-table";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

import { Fragment, RefObject, useEffect, useRef, useState } from "react";

import {
    ignoredElementsRefAtom,
    selectedRowAtom,
    canTorrentDetailsClearAtom,
} from "@/atoms/table";
import { useAtom, useAtomValue } from "jotai";
import { TorrentInfo } from "@/types/socket/torrent_info";
import { RowContextMenu } from "./context-menu";
import { cn } from "@/lib/utils";
import { ColumnResizer } from "../column-resizer";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface TorrentDataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
}
export function TorrentDataTable<TData, TValue>({
    columns,
    data,
}: TorrentDataTableProps<TData, TValue>) {
    "use no memo";
    const [sorting, setSorting] = useState<SortingState>([]);
    const [rowSelection, setRowSelection] = useAtom(selectedRowAtom);
    const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});
    const [ignoredElementsRef, setIgnoredElementsRef] = useAtom(
        ignoredElementsRefAtom,
    );
    const canTorrentDetailsClear = useAtomValue(canTorrentDetailsClearAtom);
    const tableRef = useRef<HTMLTableElement>(null);
    const scrollBarRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setIgnoredElementsRef((prev) => [
            ...prev,
            ...[tableRef, scrollBarRef]
                .filter((ref) => ref.current)
                .map((ref) => ref as RefObject<HTMLElement>),
        ]);

        return () => {
            setIgnoredElementsRef((prev) =>
                prev.filter((el) => el !== tableRef && el !== scrollBarRef),
            );
        };
    }, [tableRef, scrollBarRef, setIgnoredElementsRef]);

    const table = useReactTable({
        data,
        columns,
        enableColumnResizing: true,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        onSortingChange: setSorting,
        onColumnSizingChange: setColumnSizing,
        columnResizeMode: "onChange",
        state: {
            sorting,
            rowSelection,
            columnSizing,
        },
        onRowSelectionChange: setRowSelection,
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
            console.log(canTorrentDetailsClear);
            if (!canTorrentDetailsClear) return;
            if (event.button !== 0) return; // Only left click
            const target = event.target as Node;

            for (const ref of ignoredElementsRef) {
                if (ref.current && ref.current.contains(target)) {
                    return;
                }
            }
            setRowSelection({});
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [canTorrentDetailsClear, setRowSelection, ignoredElementsRef]);

    return (
        <div className="h-full w-full rounded-md border">
            <ScrollArea className="relative h-full w-full">
                <div ref={tableRef} role="table">
                    <Table style={{ width: table.getTotalSize() }}>
                        <TableHeader>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <TableHead
                                            key={header.id}
                                            className="relative text-center"
                                            style={{
                                                width: header.getSize(),
                                            }}
                                        >
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                      header.column.columnDef
                                                          .header,
                                                      header.getContext(),
                                                  )}

                                            <ColumnResizer<TData>
                                                header={header}
                                            />
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
                                                rowData={
                                                    row.original as TorrentInfo
                                                }
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
                                                    className={cn(
                                                        isSelected
                                                            ? "bg-blue-100"
                                                            : "",
                                                        "cursor-pointer",
                                                    )}
                                                >
                                                    {row
                                                        .getVisibleCells()
                                                        .map((cell) => (
                                                            <TableCell
                                                                key={cell.id}
                                                                style={{
                                                                    width: cell.column.getSize(),
                                                                    minWidth:
                                                                        cell
                                                                            .column
                                                                            .columnDef
                                                                            .minSize,
                                                                }}
                                                            >
                                                                {flexRender(
                                                                    cell.column
                                                                        .columnDef
                                                                        .cell,
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
                <div
                    className="absolute bottom-0 left-0 h-4 w-full bg-transparent"
                    ref={scrollBarRef}
                >
                    <ScrollBar orientation="horizontal" />
                </div>
            </ScrollArea>
        </div>
    );
}
