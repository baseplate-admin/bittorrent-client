"use client";
import React, { useState, useMemo } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { formatBytes } from "@/lib/formatBytes";

export interface FileInfo {
    path: string;
    size: number;
    progress: number;
    remaining: number;
    priority: number;
}

interface FileItem {
    name: string;
    size: number;
    progress: number;
    remaining: number;
    priority: number;
    children?: FileItem[];
    path: string;
}

function buildFileTree(files: FileInfo[]): FileItem[] {
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

    function convert(node: Record<string, any>): FileItem[] {
        return Object.values(node).map((entry: any) => {
            let children: FileItem[] | undefined;
            if (entry.children && Object.keys(entry.children).length) {
                children = convert(entry.children);
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
                    (max: number, c: FileItem) =>
                        c.priority > max ? c.priority : max,
                    0,
                );
            }
            return {
                name: entry.name,
                size: entry.size,
                progress: entry.progress,
                remaining: entry.remaining,
                priority: entry.priority,
                path: entry.path,
                children,
            };
        });
    }

    return convert(root);
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
// Recursive row renderer
function RenderRow({ file, depth = 0 }: { file: FileItem; depth?: number }) {
    const [expanded, setExpanded] = useState(true);
    const hasChildren = file.children && file.children.length > 0;

    return (
        <>
            <TableRow>
                <TableCell
                    style={{ paddingLeft: depth * 24 }}
                    className="px-4 py-2"
                >
                    <div className="flex items-center">
                        {hasChildren ? (
                            <button
                                onClick={() => setExpanded(!expanded)}
                                aria-label={
                                    expanded
                                        ? "Collapse folder"
                                        : "Expand folder"
                                }
                                className="focus:outline-none"
                                type="button"
                            >
                                {expanded ? (
                                    <ChevronDown size={14} />
                                ) : (
                                    <ChevronRight size={14} />
                                )}
                            </button>
                        ) : (
                            <span className="inline-block w-4" />
                        )}
                        <span className="ml-1 select-text">{file.name}</span>
                    </div>
                </TableCell>
                <TableCell className="px-4 py-2">
                    {formatBytes({ bytes: file.size })}
                </TableCell>
                <TableCell className="px-4 py-2">
                    <Progress value={file.progress * 100} className="w-24" />
                </TableCell>
                <TableCell className="px-4 py-2">
                    {formatPriority(file.priority)}
                </TableCell>
                <TableCell className="px-4 py-2">
                    {formatBytes({ bytes: file.remaining })}
                </TableCell>
            </TableRow>
            {expanded &&
                hasChildren &&
                file.children!.map((child) => (
                    <RenderRow
                        key={child.path}
                        file={child}
                        depth={(depth || 0) + 1}
                    />
                ))}
        </>
    );
}
export function FileTreeTable({ files }: { files: FileInfo[] }) {
    const fileTree = useMemo(() => buildFileTree(files), [files]);

    return (
        <div className="overflow-hidden rounded-xl border shadow-sm">
            <Table className="min-w-full text-sm">
                <TableHeader className="bg-muted text-muted-foreground">
                    <TableRow>
                        <TableHead className="px-4 py-2 text-left">
                            Name
                        </TableHead>
                        <TableHead className="px-4 py-2 text-left">
                            Total Size
                        </TableHead>
                        <TableHead className="px-4 py-2 text-left">
                            Progress
                        </TableHead>
                        <TableHead className="px-4 py-2 text-left">
                            Download Priority
                        </TableHead>
                        <TableHead className="px-4 py-2 text-left">
                            Remaining
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {fileTree.map((file) => (
                        <RenderRow key={file.path} file={file} />
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
