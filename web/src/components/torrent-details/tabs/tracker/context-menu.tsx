import {
    ContextMenu,
    ContextMenuCheckboxItem,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuLabel,
    ContextMenuRadioGroup,
    ContextMenuRadioItem,
    ContextMenuSeparator,
    ContextMenuShortcut,
    ContextMenuSub,
    ContextMenuSubContent,
    ContextMenuSubTrigger,
    ContextMenuTrigger,
} from "@/components/ui/context-menu";

import { ignoredElementsRefAtom } from "@/atoms/table";
import { useSetAtom } from "jotai";
import { useCallback, useRef } from "react";
export function TrackerTabContextMenu({
    children,
}: {
    children: React.ReactElement;
}) {
    const setIgnoredElements = useSetAtom(ignoredElementsRefAtom);
    const lastNodeRef = useRef<HTMLDivElement | null>(null);

    const contextMenuRefCallback = useCallback(
        (node: HTMLDivElement | null) => {
            if (node) {
                // Mounting
                lastNodeRef.current = node;
                setIgnoredElements((prev) => {
                    const list = Array.isArray(prev) ? prev : [];
                    const exists = list.some((el) => el?.current === node);
                    if (!exists) {
                        return [...list, { current: node }];
                    }
                    return list;
                });
            } else {
                // Unmounting
                const nodeToRemove = lastNodeRef.current;
                lastNodeRef.current = null;
                if (nodeToRemove) {
                    setIgnoredElements((prev) => {
                        const list = Array.isArray(prev) ? prev : [];
                        return list.filter(
                            (el) => el?.current !== nodeToRemove,
                        );
                    });
                }
            }
        },
        [setIgnoredElements],
    );

    return (
        <ContextMenu>
            <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
            <ContextMenuContent ref={contextMenuRefCallback} className="w-52">
                <ContextMenuItem inset>
                    Back
                    <ContextMenuShortcut>⌘[</ContextMenuShortcut>
                </ContextMenuItem>
                <ContextMenuItem inset disabled>
                    Forward
                    <ContextMenuShortcut>⌘]</ContextMenuShortcut>
                </ContextMenuItem>
                <ContextMenuItem inset>
                    Reload
                    <ContextMenuShortcut>⌘R</ContextMenuShortcut>
                </ContextMenuItem>
                <ContextMenuSub>
                    <ContextMenuSubTrigger inset>
                        More Tools
                    </ContextMenuSubTrigger>
                    <ContextMenuSubContent className="w-44">
                        <ContextMenuItem>Save Page...</ContextMenuItem>
                        <ContextMenuItem>Create Shortcut...</ContextMenuItem>
                        <ContextMenuItem>Name Window...</ContextMenuItem>
                        <ContextMenuSeparator />
                        <ContextMenuItem>Developer Tools</ContextMenuItem>
                        <ContextMenuSeparator />
                        <ContextMenuItem variant="destructive">
                            Delete
                        </ContextMenuItem>
                    </ContextMenuSubContent>
                </ContextMenuSub>
                <ContextMenuSeparator />
                <ContextMenuCheckboxItem checked>
                    Show Bookmarks
                </ContextMenuCheckboxItem>
                <ContextMenuCheckboxItem>
                    Show Full URLs
                </ContextMenuCheckboxItem>
                <ContextMenuSeparator />
                <ContextMenuRadioGroup value="pedro">
                    <ContextMenuLabel inset>People</ContextMenuLabel>
                    <ContextMenuRadioItem value="pedro">
                        Pedro Duarte
                    </ContextMenuRadioItem>
                    <ContextMenuRadioItem value="colm">
                        Colm Tuite
                    </ContextMenuRadioItem>
                </ContextMenuRadioGroup>
            </ContextMenuContent>
        </ContextMenu>
    );
}
