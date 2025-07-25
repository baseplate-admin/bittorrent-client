import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useSocketConnection } from "@/hooks/use-socket";
import { Input } from "@/components/ui/input";
export function EditTrackerDialog({
    open,
    onOpenChange,
    infoHash,

    trackerURL,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    infoHash: string;
    trackerURL: string;
}) {
    const [inputValue, setInputValue] = useState(trackerURL);
    const socket = useSocketConnection();
    const handleEditButtonClick = () => {
        socket.current?.emit(
            "libtorrent:rename_trackers",
            {
                info_hash: infoHash,
                old_tracker: trackerURL,
                new_tracker: inputValue,
            },
            (response: { status: "error" | "success"; message: string }) => {
                console.log(response);
                if (response.status === "success") {
                    onOpenChange(false);
                }
            },
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Trackers</DialogTitle>
                    <DialogDescription asChild>
                        <div className="flex flex-col gap-4 py-3">
                            <Input
                                value={inputValue}
                                onInput={(event) => {
                                    setInputValue(event.currentTarget.value);
                                }}
                                placeholder="Enter tracker URL"
                            />
                        </div>
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button onClick={() => handleEditButtonClick()}>
                        Edit
                    </Button>
                    <DialogTrigger asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogTrigger>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
