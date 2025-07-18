import { atom } from "jotai";
import { RowSelectionState } from "@tanstack/react-table";

export const selectedRowAtom = atom<RowSelectionState>({});
