"use client";
import React, { useState } from "react";
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
import { FileInfo } from "@/types/socket/files";
import { formatBytes } from "@/lib/formatBytes";

export interface FileItem {
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
        const parts = file.path.split("/");
        let current = root;

        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            if (!current[part]) {
                current[part] = {
                    name: part,
                    size: 0,
                    progress: 0,
                    remaining: 0,
                    priority: file.priority,
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
            const item: FileItem = {
                name: entry.name,
                size: entry.size,
                progress: entry.progress,
                remaining: entry.remaining,
                priority: entry.priority,
                path: entry.path,
                children: entry.children ? convert(entry.children) : undefined,
            };
            return item;
        });
    }

    return convert(root);
}

function FileRow({ file, depth = 0 }: { file: FileItem; depth?: number }) {
    const [expanded, setExpanded] = useState(true);
    const hasChildren = !!file.children?.length;

    return (
        <>
            <TableRow>
                <TableCell className="px-4 py-2">
                    <div
                        className="flex items-center"
                        style={{ paddingLeft: `${depth * 1}rem` }}
                    >
                        {hasChildren ? (
                            <button onClick={() => setExpanded(!expanded)}>
                                {expanded ? (
                                    <ChevronDown size={14} />
                                ) : (
                                    <ChevronRight size={14} />
                                )}
                            </button>
                        ) : (
                            <span className="inline-block w-4" />
                        )}
                        <span className="ml-1">{file.name}</span>
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
                    {formatBytes({
                        bytes: file.remaining,
                    })}
                </TableCell>
            </TableRow>
            {expanded &&
                file.children?.map((child) => (
                    <FileRow key={child.path} file={child} depth={depth + 1} />
                ))}
        </>
    );
}

export function FileTreeTable({ fileData }: { fileData: FileItem[] }) {
    return (
        <div className="overflow-auto rounded-xl border shadow-sm">
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
                    {fileData.map((file) => (
                        <FileRow key={file.path} file={file} />
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

function formatPriority(priority: number): string {
    const map = {
        0: "Do Not Download",
        1: "Low",
        2: "Low",
        3: "Normal",
        4: "Normal",
        5: "High",
        6: "High",
        7: "Maximum",
    };
    return map[priority as keyof typeof map] ?? "Unknown";
}
