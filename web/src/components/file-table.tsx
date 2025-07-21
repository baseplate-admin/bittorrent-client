import React, { useState } from "react";
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

type FileItem = {
    name: string;
    size: number;
    progress: number;
    priority: number;
    remaining: number;
    children?: FileItem[];
};

function FileRow({ file, depth = 0 }: { file: FileItem; depth?: number }) {
    const [expanded, setExpanded] = useState(true);
    const hasChildren = (file.children ?? []).length > 0;

    return (
        <>
            <TableRow className="hover:bg-muted">
                <TableCell
                    className="py-2"
                    style={{ paddingLeft: `${depth * 24 + 16}px` }}
                >
                    <div className="flex items-center space-x-1">
                        {hasChildren && (
                            <button
                                onClick={() => setExpanded(!expanded)}
                                className="text-muted-foreground"
                            >
                                {expanded ? (
                                    <ChevronDown size={16} />
                                ) : (
                                    <ChevronRight size={16} />
                                )}
                            </button>
                        )}
                        <span>{file.name}</span>
                    </div>
                </TableCell>
                <TableCell className="px-4 py-2">{file.size}</TableCell>
                <TableCell className="w-40 px-4 py-2">
                    <Progress value={file.progress} className="h-2" />
                </TableCell>
                <TableCell className="px-4 py-2">{file.priority}</TableCell>
                <TableCell className="px-4 py-2">{file.remaining}</TableCell>
            </TableRow>
            {expanded &&
                file.children?.map((child, idx) => (
                    <FileRow key={idx} file={child} depth={depth + 1} />
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
                    {fileData.map((file, idx) => (
                        <FileRow key={idx} file={file} />
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
