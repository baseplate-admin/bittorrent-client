"use client";

import React, { useMemo, useState } from "react";
import {
    ColumnDef,
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
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, ChevronRight } from "lucide-react";
import { FileInfo } from "@/types/socket/files";
import { formatBytes } from "@/lib/formatBytes";

export type ColumnId = "name" | "size" | "progress" | "priority" | "remaining";

interface FileItem {
    name: string;
    size: number;
    progress: number;
    remaining: number;
    priority: number;
    children?: FileItem[];
    path: string;
    depth: number;
}

function formatPriority(priority: number): string {
    const map: Record<number, string> = {
        0: "Do Not Download",
        1: "Low",
        2: "Low",
        3: "Normal",
        4: "Normal",
        5: "High",
        6: "High",
        7: "Maximum",
    };
    return map[priority] ?? "Unknown";
}

function buildFlatFileTree(files: FileInfo[]): FileItem[] {
    const root: Record<string, any> = {};

    for (const file of files) {
        const parts = file.path.split(/[/\\]+/);
        let current = root;

        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            if (!current[part]) {
                current[part] = {
                    name: part,
                    size: 0,
                    progress: 0,
                    remaining: 0,
                    priority: 0,
                    children: {},
                    path: parts.slice(0, i + 1).join("/"),
                };
            }
            if (i === parts.length - 1) {
                current[part].size = file.size;
                current[part].progress = file.progress;
                current[part].remaining = file.remaining;
                current[part].priority = file.priority;
            }
            current = current[part].children;
        }
    }

    function flatten(node: Record<string, any>, depth = 0): FileItem[] {
        const items: FileItem[] = [];

        for (const entry of Object.values(node)) {
            let children: FileItem[] | undefined;

            if (entry.children && Object.keys(entry.children).length) {
                children = flatten(entry.children, depth + 1);
                entry.size = children.reduce(
                    (sum: number, c: FileItem) => sum + c.size,
                    0,
                );
                entry.progress =
                    children.reduce(
                        (sum: number, c: FileItem) => sum + c.progress * c.size,
                        0,
                    ) / (entry.size || 1);
                entry.remaining = children.reduce(
                    (sum: number, c: FileItem) => sum + c.remaining,
                    0,
                );
                entry.priority = children.reduce(
                    (max: number, c: FileItem) => Math.max(max, c.priority),
                    0,
                );
            }

            const flat: FileItem = {
                name: entry.name,
                size: entry.size,
                progress: entry.progress,
                remaining: entry.remaining,
                priority: entry.priority,
                path: entry.path,
                children,
                depth,
            };

            items.push(flat);

            if (children) {
                items.push(...children);
            }
        }

        return items;
    }

    return flatten(root);
}

function createColumns(
    expandedRows: Set<string>,
    toggle: (path: string) => void,
    selected: Set<string>,
    setSelected: (path: string, checked: boolean) => void,
    visibleColumns: ColumnId[],
): ColumnDef<FileItem>[] {
    const baseColumns: ColumnDef<FileItem>[] = [];

    baseColumns.push({
        id: "select",
        header: () => null,
        cell: ({ row }) => {
            const file = row.original;
            return (
                <Checkbox
                    checked={selected.has(file.path)}
                    onCheckedChange={(v) => setSelected(file.path, Boolean(v))}
                />
            );
        },
        size: 32,
    });

    const allColumns: ColumnDef<FileItem>[] = [
        {
            id: "name",
            accessorKey: "name",
            header: "Name",
            cell: ({ row }) => {
                const file = row.original;
                const hasChildren = !!file.children?.length;
                const isExpanded = expandedRows.has(file.path);
                const isSelected = selected.has(file.path);

                return (
                    <div
                        className={`flex items-center ${!isSelected ? "opacity-50" : ""}`}
                        style={{ paddingLeft: file.depth * 24 }}
                    >
                        {hasChildren ? (
                            <button
                                onClick={() => toggle(file.path)}
                                className="mr-1 focus:outline-none"
                            >
                                {isExpanded ? (
                                    <ChevronDown size={14} />
                                ) : (
                                    <ChevronRight size={14} />
                                )}
                            </button>
                        ) : (
                            <span className="inline-block w-4" />
                        )}
                        <span className="truncate">{file.name}</span>
                    </div>
                );
            },
        },
        {
            id: "size",
            accessorKey: "size",
            header: "Total Size",
            cell: ({ row }) => formatBytes({ bytes: row.original.size }),
        },
        {
            id: "progress",
            accessorKey: "progress",
            header: "Progress",
            cell: ({ row }) => (
                <Progress
                    value={row.original.progress * 100}
                    className="w-24"
                />
            ),
        },
        {
            id: "priority",
            accessorKey: "priority",
            header: "Download Priority",
            cell: ({ row }) => formatPriority(row.original.priority),
        },
        {
            id: "remaining",
            accessorKey: "remaining",
            header: "Remaining",
            cell: ({ row }) => formatBytes({ bytes: row.original.remaining }),
        },
    ];

    return baseColumns.concat(
        allColumns.filter((col) => visibleColumns.includes(col.id as ColumnId)),
    );
}

export function FileTreeTable({
    files,
    visibleColumns = ["name", "size", "progress", "priority", "remaining"],
    onSelectChange,
}: {
    files: FileInfo[];
    visibleColumns?: ColumnId[];
    onSelectChange?: (selectedPaths: string[]) => void;
}) {
    const allRows = useMemo(() => buildFlatFileTree(files), [files]);

    const rootPaths = useMemo(() => {
        return new Set(allRows.filter((r) => r.depth === 0).map((r) => r.path));
    }, [allRows]);

    const [expandedRows, setExpandedRows] = useState<Set<string>>(rootPaths);
    const [selectedPaths, setSelectedPaths] = useState<Set<string>>(() => {
        return new Set(allRows.map((r) => r.path)); // all selected initially
    });

    const visibleRows = useMemo(() => {
        const visible: FileItem[] = [];
        for (const row of allRows) {
            const parent = row.path.split("/").slice(0, -1).join("/");
            if (row.depth === 0 || expandedRows.has(parent)) {
                visible.push(row);
            }
        }
        return visible;
    }, [allRows, expandedRows]);

    const toggle = (path: string) => {
        setExpandedRows((prev) => {
            const copy = new Set(prev);
            copy.has(path) ? copy.delete(path) : copy.add(path);
            return copy;
        });
    };

    const setSelected = (path: string, checked: boolean) => {
        const affectedPaths = new Set<string>();
        const baseDepth = allRows.find((r) => r.path === path)?.depth ?? 0;
        let startCollecting = false;

        for (const r of allRows) {
            if (r.path === path) {
                startCollecting = true;
                affectedPaths.add(r.path); // Always include the clicked folder
                continue;
            }
            if (startCollecting) {
                if (r.depth <= baseDepth) break; // stop when sibling/parent appears
                affectedPaths.add(r.path);
            }
        }

        setSelectedPaths((prev) => {
            const copy = new Set(prev);
            if (checked) {
                affectedPaths.forEach((p) => copy.add(p));
            } else {
                affectedPaths.forEach((p) => copy.delete(p));
            }
            onSelectChange?.(Array.from(copy));
            return copy;
        });
    };
    const table = useReactTable({
        data: visibleRows,
        columns: createColumns(
            expandedRows,
            toggle,
            selectedPaths,
            setSelected,
            visibleColumns,
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
                                    {flexRender(
                                        header.column.columnDef.header,
                                        header.getContext(),
                                    )}
                                </TableHead>
                            ))}
                        </TableRow>
                    ))}
                </TableHeader>

                <TableBody>
                    {table.getRowModel().rows.map((row) => {
                        const selected = selectedPaths.has(row.original.path);
                        return (
                            <TableRow
                                key={row.id}
                                className={!selected ? "opacity-50" : ""}
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
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}
