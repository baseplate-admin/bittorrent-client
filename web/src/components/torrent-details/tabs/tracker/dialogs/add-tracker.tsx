import { Textarea } from "@/components/ui/textarea";
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

export function AddTrackerDialog({
    open,
    onOpenChange,
    infoHash,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    infoHash: string;
}) {
    const [textAreaValue, setTextAreaValue] = useState("");
    const socket = useSocketConnection();
    const handleAddButtonClick = () => {
        socket.current?.emit(
            "libtorrent:add_tracker",
            {
                info_hash: infoHash,
                trackers: textAreaValue
                    .split("\n")
                    .map((line) => line.trim())
                    .filter((line) => line.length > 0),
            },
            (response: { status: "error" | "success"; message: string }) => {
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
                    <DialogTitle>Add Trackers</DialogTitle>
                    <DialogDescription asChild>
                        <div className="flex flex-col gap-4 py-3">
                            <Textarea
                                value={textAreaValue}
                                onChange={(e) =>
                                    setTextAreaValue(e.target.value)
                                }
                                className="h-32"
                                placeholder="List of trackers to add"
                            />
                            <p className="text-sm italic">
                                One link per line (udp,http,wss are supported)
                            </p>
                        </div>
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button onClick={() => handleAddButtonClick()}>Add</Button>

                    <Button
                        onClick={() => {
                            onOpenChange(false);
                        }}
                        variant="outline"
                    >
                        Cancel
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
