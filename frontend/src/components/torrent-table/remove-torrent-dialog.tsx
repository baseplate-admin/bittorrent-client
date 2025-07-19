"use client";

import { Checkbox } from "../ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
    DialogTrigger,
} from "../ui/dialog";
import { Label } from "../ui/label";
import { useState } from "react";
import { Button } from "../ui/button";
import { DialogHeader, DialogFooter } from "../ui/dialog";

export function RemoveTorrentDialog({
    open,
    setOpen,
    name,
    handleButtonClick,
}: {
    open: boolean;
    setOpen: (open: boolean) => void;
    name: string;
    handleButtonClick: ({
        setOpen,
        remove_data,
    }: {
        setOpen: (open: boolean) => void;
        remove_data: boolean;
    }) => void;
}) {
    const [removeData, setRemoveData] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Remove Torrent</DialogTitle>
                    <DialogDescription asChild>
                        <div className="mt-4 flex flex-col gap-4">
                            <p>
                                Are you sure you want to remove "{name}" from
                                the transfer list?
                            </p>
                            <div className="flex items-center justify-start gap-3 px-1">
                                <Checkbox
                                    id="remove-content-file"
                                    checked={removeData}
                                    onCheckedChange={(checked) => {
                                        setRemoveData(!!checked);
                                    }}
                                />
                                <Label
                                    htmlFor="remove-content-file"
                                    className="text-sm italic"
                                >
                                    Also remove the content files
                                </Label>
                            </div>
                        </div>
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() =>
                            handleButtonClick({
                                setOpen,
                                remove_data: removeData,
                            })
                        }
                    >
                        Okay
                    </Button>
                    <DialogTrigger asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogTrigger>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
