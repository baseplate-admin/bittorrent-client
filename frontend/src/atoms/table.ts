import { atom } from "jotai";
import { RowSelectionState } from "@tanstack/react-table";
import { RefObject } from "react";

export const selectedRowAtom = atom<RowSelectionState>({});
export const ignoredElementsRefAtom = atom<RefObject<HTMLElement>[]>([]);
