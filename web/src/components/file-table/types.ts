export type ColumnId = "name" | "size" | "progress" | "priority" | "remaining";

export interface FileItem {
    name: string;
    size: number;
    progress: number;
    remaining: number;
    priority: number;
    children?: FileItem[];
    path: string;
    depth: number;
}
