import { useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { File, Folder, FolderOpen } from "lucide-react";
import { formatBytes } from "@/lib/formatBytes";

type FileNode = {
    name: string;
    size?: number;
    children?: FileNode[];
    path: string;
};

function buildTree(files: { path: string; size: number }[]): FileNode[] {
    const root: FileNode[] = [];

    files.forEach(({ path, size }) => {
        const parts = path.split("/");
        let currentLevel = root;
        let accumulatedPath = "";

        parts.forEach((part, idx) => {
            accumulatedPath += (accumulatedPath ? "/" : "") + part;

            let existingNode = currentLevel.find((n) => n.name === part);
            if (!existingNode) {
                existingNode = {
                    name: part,
                    path: accumulatedPath,
                    ...(idx === parts.length - 1 ? { size } : { children: [] }),
                };
                currentLevel.push(existingNode);
            }
            if (existingNode.children) currentLevel = existingNode.children;
        });
    });

    return root;
}

export const FileTree: React.FC<{
    files: { path: string; size: number }[];
}> = ({ files }) => {
    const treeData = buildTree(files);

    return (
        <div className="max-h-[400px] overflow-auto text-sm text-gray-200">
            {treeData.length === 0 ? (
                <div className="py-10 text-center text-gray-500">
                    No files available
                </div>
            ) : (
                <TreeNodes nodes={treeData} level={0} />
            )}
        </div>
    );
};

const TreeNodes: React.FC<{ nodes: FileNode[]; level: number }> = ({
    nodes,
    level,
}) => {
    const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});

    const toggleFolder = useCallback(
        (path: string) => {
            setOpenFolders((prev) => ({ ...prev, [path]: !prev[path] }));
        },
        [setOpenFolders],
    );

    const handleKey = (
        e: React.KeyboardEvent<HTMLDivElement>,
        path: string,
        isFolder: boolean,
    ) => {
        if (!isFolder) return;
        if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            toggleFolder(path);
        }
    };

    return (
        <ul className="select-none">
            {nodes.map((node) => {
                const isFolder = !!node.children;
                const isOpen = openFolders[node.path] || false;

                return (
                    <li key={node.path}>
                        <div
                            role={isFolder ? "button" : undefined}
                            tabIndex={isFolder ? 0 : undefined}
                            aria-expanded={isFolder ? isOpen : undefined}
                            onClick={() => isFolder && toggleFolder(node.path)}
                            onKeyDown={(e) => handleKey(e, node.path, isFolder)}
                            className={`flex items-center gap-2 rounded-md px-1 py-0.5 ${isFolder ? "cursor-pointer" : ""} hover:bg-muted focus:bg-muted focus:outline-none`}
                            style={{ paddingLeft: `${level * 16 + 8}px` }}
                        >
                            {isFolder ? (
                                isOpen ? (
                                    <FolderOpen className="h-5 w-5 text-yellow-400" />
                                ) : (
                                    <Folder className="h-5 w-5 text-yellow-300" />
                                )
                            ) : (
                                <File className="text-muted-foreground h-4 w-4" />
                            )}
                            <span
                                className={`max-w-xs truncate ${
                                    isFolder
                                        ? "text-foreground font-semibold"
                                        : "text-muted-foreground font-mono"
                                }`}
                                title={node.name}
                            >
                                {node.name}
                            </span>
                            {!isFolder && (
                                <span className="text-muted-foreground ml-auto text-xs">
                                    {formatBytes({ bytes: node.size! })}
                                </span>
                            )}
                        </div>

                        <AnimatePresence initial={false}>
                            {isFolder && isOpen && node.children && (
                                <motion.ul
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                >
                                    <TreeNodes
                                        nodes={node.children}
                                        level={level + 1}
                                    />
                                </motion.ul>
                            )}
                        </AnimatePresence>
                    </li>
                );
            })}
        </ul>
    );
};
