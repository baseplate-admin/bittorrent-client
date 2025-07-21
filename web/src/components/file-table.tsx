import React, { useState, useMemo } from "react";
import { Progress } from "@/components/ui/progress";
import { ChevronDown, ChevronRight } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { formatBytes } from "@/lib/formatBytes";
import { FileInfo } from "@/types/socket/files";

type FileItem = {
    name: string;
    size: number;
    progress: number;
    remaining: number;
    priority: number;
    children?: FileItem[];
};

export enum LibtorrentFilePriority {
    Skip = 0,
    Lower = 1,
    Low = 2,
    Normal = 3,
    Default = 4,
    High = 5,
    Higher = 6,
    Highest = 7,
}
export function getPriorityLabel(p: number): string {
    switch (p) {
        case 0:
            return "Skip";
        case 1:
            return "Lower";
        case 2:
            return "Low";
        case 3:
        case 4:
            return "Normal";
        case 5:
            return "High";
        case 6:
            return "Higher";
        case 7:
            return "Highest";
        default:
            return "Unknown";
    }
}

// 1) pull out the common top‑level folder name
function getCommonRoot(files: FileInfo[]): string | null {
    if (files.length === 0) return null;
    const first = files[0].path.split("/")[0];
    for (let i = 1; i < files.length; i++) {
        if (files[i].path.split("/")[0] !== first) {
            return null;
        }
    }
    return first;
}

// 2) build a nested tree under that common root
function buildTree(files: FileInfo[]): FileItem[] {
    const rootName = getCommonRoot(files);

    // strip off rootName/ from each path
    const stripped = rootName
        ? files.map((f) => ({ ...f, path: f.path.slice(rootName.length + 1) }))
        : files;

    // intermediate nested map
    const map: Record<string, any> = {};

    for (const file of stripped) {
        const parts = file.path.split("/");
        let curr = map;
        for (let i = 0; i < parts.length; i++) {
            const seg = parts[i];
            if (!curr[seg]) {
                curr[seg] = {
                    name: seg,
                    // default zero values; will override on leaf
                    size: 0,
                    progress: 0,
                    remaining: 0,
                    priority: LibtorrentFilePriority.Default,
                    children: {},
                };
            }
            if (i === parts.length - 1) {
                // leaf node: file
                curr[seg] = {
                    name: file.name,
                    size: file.size,
                    progress: file.progress,
                    remaining: file.remaining,
                    priority: file.priority,
                };
            } else {
                curr = curr[seg].children;
            }
        }
    }

    // convert nested map → FileItem[]
    function convert(node: Record<string, any>): FileItem[] {
        return Object.values(node).map((item: any) => ({
            name: item.name,
            size: item.size,
            progress: item.progress,
            remaining: item.remaining,
            priority: item.priority,
            children: item.children
                ? convert(item.children as Record<string, any>)
                : undefined,
        }));
    }

    const children = convert(map);

    // if we had a common root, make it an explicit top node
    if (rootName) {
        // aggregate size & weighted progress
        const totalSize = children.reduce((sum, c) => sum + c.size, 0);
        const weightedProgress =
            totalSize > 0
                ? children.reduce((sum, c) => sum + c.progress * c.size, 0) /
                  totalSize
                : 0;
        const totalRemaining = children.reduce(
            (sum, c) => sum + c.remaining,
            0,
        );

        return [
            {
                name: rootName,
                size: totalSize,
                progress: weightedProgress,
                remaining: totalRemaining,
                priority: LibtorrentFilePriority.Default,
                children,
            },
        ];
    }

    return children;
}

function FileRow({
    file,
    depth = 0,
    visibleColumns,
}: {
    file: FileItem;
    depth?: number;
    visibleColumns: string[];
}) {
    const [open, setOpen] = useState(true);
    const hasKids = !!file.children?.length;

    return (
        <>
            <TableRow className="hover:bg-muted">
                <TableCell
                    className="py-2"
                    style={{ paddingLeft: `${depth * 24 + 16}px` }}
                >
                    <div className="flex items-center gap-1">
                        {hasKids && (
                            <button
                                onClick={() => setOpen(!open)}
                                className="text-muted-foreground"
                                aria-label={open ? "Collapse" : "Expand"}
                            >
                                {open ? (
                                    <ChevronDown size={16} />
                                ) : (
                                    <ChevronRight size={16} />
                                )}
                            </button>
                        )}
                        <span>{file.name}</span>
                    </div>
                </TableCell>

                {visibleColumns.includes("size") && (
                    <TableCell className="px-4 py-2">
                        {formatBytes({ bytes: file.size })}
                    </TableCell>
                )}
                {visibleColumns.includes("progress") && (
                    <TableCell className="w-40 px-4 py-2">
                        <Progress value={file.progress} className="h-2" />
                    </TableCell>
                )}
                {visibleColumns.includes("priority") && (
                    <TableCell className="px-4 py-2">
                        {getPriorityLabel(file.priority)}
                    </TableCell>
                )}
                {visibleColumns.includes("remaining") && (
                    <TableCell className="px-4 py-2">
                        {formatBytes({ bytes: file.remaining })}
                    </TableCell>
                )}
                {visibleColumns.includes("availability") && (
                    <TableCell className="px-4 py-2">N/A</TableCell>
                    /* hook your availability logic here */
                )}
            </TableRow>
            {open &&
                file.children?.map((child, i) => (
                    <FileRow
                        key={`${file.name}-${i}`}
                        file={child}
                        depth={depth + 1}
                        visibleColumns={visibleColumns}
                    />
                ))}
        </>
    );
}

export function FileTreeTable({
    files,
    visibleColumns = [
        "size",
        "progress",
        "priority",
        "remaining",
        "availability",
    ],
}: {
    files: FileInfo[];
    visibleColumns?: string[];
}) {
    const tree = useMemo(() => buildTree(files), [files]);

    return (
        <div className="overflow-auto rounded-xl border shadow-sm">
            <Table className="min-w-full text-sm">
                <TableHeader className="bg-muted text-muted-foreground">
                    <TableRow>
                        <TableHead className="px-4 py-2 text-left">
                            Name
                        </TableHead>
                        {visibleColumns.includes("size") && (
                            <TableHead className="px-4 py-2 text-left">
                                Total Size
                            </TableHead>
                        )}
                        {visibleColumns.includes("progress") && (
                            <TableHead className="px-4 py-2 text-left">
                                Progress
                            </TableHead>
                        )}
                        {visibleColumns.includes("priority") && (
                            <TableHead className="px-4 py-2 text-left">
                                Download Priority
                            </TableHead>
                        )}
                        {visibleColumns.includes("remaining") && (
                            <TableHead className="px-4 py-2 text-left">
                                Remaining
                            </TableHead>
                        )}
                        {visibleColumns.includes("availability") && (
                            <TableHead className="px-4 py-2 text-left">
                                Availability
                            </TableHead>
                        )}
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {tree.map((node, idx) => (
                        <FileRow
                            key={`root-${idx}`}
                            file={node}
                            visibleColumns={visibleColumns}
                        />
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
