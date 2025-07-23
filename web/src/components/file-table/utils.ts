import type { FileItem } from "./types";

export function getDescendantPaths(
    allRows: FileItem[],
    path: string,
): string[] {
    const result: string[] = [];
    const stack = [path];
    while (stack.length > 0) {
        const current = stack.pop()!;
        result.push(current);
        const children = allRows.filter(
            (r) => r.path !== current && r.path.startsWith(current + "/"),
        );
        for (const child of children) {
            if (!result.includes(child.path)) stack.push(child.path);
        }
    }
    return result;
}
