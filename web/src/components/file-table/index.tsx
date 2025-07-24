"use client";

import { useMemo, useState, useRef } from "react";
import {
    useReactTable,
    getCoreRowModel,
    flexRender,
} from "@tanstack/react-table";
import {
    Table,
    TableHeader,
    TableRow,
    TableHead,
    TableBody,
    TableCell,
} from "@/components/ui/table";
import { buildFlatFileTree } from "./tree-builder";
import { createColumns } from "./columns";
import { getDescendantPaths } from "./utils";
import type { FileInfo } from "@/types/socket/files";
import type { ColumnId, FileItem } from "./types";

export function FileTreeTable({
    files,
    visibleColumns = ["name", "size", "progress", "priority", "remaining"],
    onSelectChange,
}: {
    files: FileInfo[];
    visibleColumns?: ColumnId[];
    onSelectChange?: (selectedPaths: string[]) => void;
}) {
    "use no memo";
    const [allRows, setAllRows] = useState<FileItem[]>(() =>
        buildFlatFileTree(files),
    );
    const savedPriorities = useRef<Map<string, number>>(new Map());

    const rootPaths = useMemo(
        () => new Set(allRows.filter((r) => r.depth === 0).map((r) => r.path)),
        [allRows],
    );
    const [expandedRows, setExpandedRows] = useState<Set<string>>(rootPaths);

    const visibleRows = useMemo(() => {
        return allRows.filter((row) => {
            const parent = row.path.split("/").slice(0, -1).join("/");
            return row.depth === 0 || expandedRows.has(parent);
        });
    }, [allRows, expandedRows]);

    const toggle = (path: string) => {
        setExpandedRows((prev) => {
            const copy = new Set(prev);
            copy.has(path) ? copy.delete(path) : copy.add(path);
            return copy;
        });
    };

    const setPriorityByCheckbox = (path: string, checked: boolean) => {
        const descendants = getDescendantPaths(allRows, path);

        setAllRows((prev) =>
            prev.map((r) => {
                if (descendants.includes(r.path)) {
                    if (!checked) {
                        if (r.priority !== 0)
                            savedPriorities.current.set(r.path, r.priority);
                        return { ...r, priority: 0 };
                    } else {
                        const saved = savedPriorities.current.get(r.path);
                        savedPriorities.current.delete(r.path);
                        return { ...r, priority: saved ?? 3 };
                    }
                }
                return r;
            }),
        );

        setTimeout(() => {
            onSelectChange?.(
                allRows
                    .filter((r) =>
                        descendants.includes(r.path) ? checked : r.priority > 0,
                    )
                    .map((r) => r.path),
            );
        }, 0);
    };

    const onPriorityChange = (path: string, newPriority: number) => {
        const descendants = getDescendantPaths(allRows, path);

        setAllRows((prev) =>
            prev.map((r) => {
                if (descendants.includes(r.path)) {
                    if (newPriority === 0 && r.priority !== 0)
                        savedPriorities.current.set(r.path, r.priority);
                    else savedPriorities.current.delete(r.path);
                    return { ...r, priority: newPriority };
                }
                return r;
            }),
        );

        setTimeout(() => {
            onSelectChange?.(
                allRows.filter((r) => r.priority > 0).map((r) => r.path),
            );
        }, 0);
    };

    const table = useReactTable({
        data: visibleRows,
        columns: createColumns(
            expandedRows,
            toggle,
            allRows,
            setPriorityByCheckbox,
            visibleColumns,
            onPriorityChange,
        ),
        getCoreRowModel: getCoreRowModel(),
        getRowId: (row) => row.path,
    });

    return (
        <div className="rounded-xl border shadow-sm">
            <Table>
                <TableHeader className="bg-muted text-muted-foreground">
                    {table.getHeaderGroups().map((group) => (
                        <TableRow key={group.id}>
                            {group.headers.map((header) => (
                                <TableHead key={header.id}>
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
                    {table.getRowModel().rows.map((row) => (
                        <TableRow
                            key={row.id}
                            className={
                                row.original.priority === 0 ? "opacity-50" : ""
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
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
