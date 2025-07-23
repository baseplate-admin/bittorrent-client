import type { FileItem } from "./types";
import type { FileInfo } from "@/types/socket/files";

export function buildFlatFileTree(files: FileInfo[]): FileItem[] {
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
                entry.size = children.reduce((sum, c) => sum + c.size, 0);
                entry.progress =
                    children.reduce((sum, c) => sum + c.progress * c.size, 0) /
                    (entry.size || 1);
                entry.remaining = children.reduce(
                    (sum, c) => sum + c.remaining,
                    0,
                );
                entry.priority = children.reduce(
                    (max, c) => Math.max(max, c.priority),
                    0,
                );
            }

            items.push({
                ...entry,
                children,
                depth,
            });

            if (children) {
                items.push(...children);
            }
        }

        return items;
    }

    return flatten(root);
}
