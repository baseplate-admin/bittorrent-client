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

import { Fragment, RefObject, useEffect, useRef, useState } from "react";

import { ignoredElementsRefAtom, selectedRowAtom } from "@/atoms/table";
import { useAtom } from "jotai";
import { TorrentInfo } from "@/types/socket/torrent_info";
import { RowContextMenu } from "./row-context-menu";

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
}

export function DataTable<TData, TValue>({
    columns,
    data,
}: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [rowSelection, setRowSelection] = useAtom(selectedRowAtom);
    const [ignoredElementsRef, setIgnoredElementsRef] = useAtom(
        ignoredElementsRefAtom,
    );
    const tableRef = useRef<HTMLTableElement>(null);
    useEffect(() => {
        const ref = tableRef as RefObject<HTMLElement>;
        if (ref.current) {
            setIgnoredElementsRef((prev) => [...prev, ref]);
        }
        return () => {
            setIgnoredElementsRef((prev) => prev.filter((el) => el !== ref));
        };
    }, [tableRef, setIgnoredElementsRef]);

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
            if (event.button !== 0) return; // Only left click

            const target = event.target as Node;

            // Check if click inside any ignored elements
            for (const ref of ignoredElementsRef) {
                if (ref.current && ref.current.contains(target)) {
                    return; // click inside ignored element → do nothing
                }
            }

            // Click outside all ignored elements → clear selection
            setRowSelection({});
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [setRowSelection, ignoredElementsRef]);

    return (
        <div className="h-full rounded-md border">
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
