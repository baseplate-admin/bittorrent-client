import React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { ChevronDown, ChevronRight } from "lucide-react";
import { formatBytes } from "@/lib/formatBytes";
import { priorityOptions } from "./priority-options";
import type { ColumnId, FileItem } from "./types";

export function createColumns(
    expandedRows: Set<string>,
    toggle: (path: string) => void,
    allRows: FileItem[],
    setPriorityByCheckbox: (path: string, checked: boolean) => void,
    visibleColumns: ColumnId[],
    onPriorityChange: (path: string, priority: number) => void,
): ColumnDef<FileItem>[] {
    const base: ColumnDef<FileItem>[] = [
        {
            id: "select",
            header: () => null,
            cell: ({ row }) => (
                <Checkbox
                    checked={row.original.priority > 0}
                    onCheckedChange={(v) =>
                        setPriorityByCheckbox(row.original.path, Boolean(v))
                    }
                />
            ),
            size: 32,
        },
    ];

    const columns: ColumnDef<FileItem>[] = [
        {
            id: "name",
            accessorKey: "name",
            header: "Name",
            cell: ({ row }) => {
                const file = row.original;
                const isExpanded = expandedRows.has(file.path);
                const hasChildren = !!file.children?.length;

                return (
                    <div
                        className="flex items-center"
                        style={{ paddingLeft: file.depth * 24 }}
                    >
                        {hasChildren ? (
                            <button
                                onClick={() => toggle(file.path)}
                                className="mr-1"
                                aria-label="Toggle"
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
            cell: ({ row }) => (
                <Select
                    value={String(row.original.priority)}
                    onValueChange={(val) =>
                        onPriorityChange(row.original.path, Number(val))
                    }
                >
                    <SelectTrigger className="h-8 w-40 text-xs">
                        <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                        {Object.entries(priorityOptions).map(
                            ([value, label]) => (
                                <SelectItem key={value} value={value}>
                                    {label}
                                </SelectItem>
                            ),
                        )}
                    </SelectContent>
                </Select>
            ),
        },
        {
            id: "remaining",
            accessorKey: "remaining",
            header: "Remaining",
            cell: ({ row }) => formatBytes({ bytes: row.original.remaining }),
        },
    ];

    return base.concat(
        columns.filter((col) => visibleColumns.includes(col.id as ColumnId)),
    );
}
