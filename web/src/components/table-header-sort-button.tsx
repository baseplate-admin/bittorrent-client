import { Button } from "./ui/button";

export const TableHeaderSortButton =
    (label: string) =>
    ({
        column,
    }: {
        column: {
            toggleSorting: (desc?: boolean) => void;
            getIsSorted: () => "asc" | "desc" | false;
        };
    }) => (
        <Button
            variant="ghost"
            className="cursor-pointer p-1 capitalize"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
            {label}
        </Button>
    );
