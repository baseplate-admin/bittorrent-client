"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAtomValue, useSetAtom } from "jotai";
import { torrentAtom } from "@/atoms/torrent";
import { selectedRowAtom, ignoredElementsRefAtom } from "@/atoms/table";
import { TorrentInfo } from "@/types/socket/torrent_info";
import { RefObject, useEffect, useRef, useState } from "react";
import { GeneralTab } from "./general";
import TrackersTab from "./tracker-tab/component";

export default function TorrentDetails() {
    const torrent = useAtomValue(torrentAtom);
    const selectedRows = useAtomValue(selectedRowAtom);
    const setIgnoredElementsRef = useSetAtom(ignoredElementsRefAtom);

    const cardRef = useRef<HTMLDivElement>(null);
    const [torrentData, setTorrentData] = useState<TorrentInfo | null>(null);

    useEffect(() => {
        const ref = cardRef as RefObject<HTMLElement>;
        if (ref.current) {
            setIgnoredElementsRef((prev) => [...prev, ref]);
        }
        return () => {
            setIgnoredElementsRef((prev) =>
                prev.filter((element) => element !== ref),
            );
        };
    }, [cardRef, setIgnoredElementsRef]);

    const keys = Object.keys(selectedRows || {});
    const index = keys.length === 1 ? keys[0] : null;
    const indexNum = index !== null ? parseInt(index, 10) : null;

    useEffect(() => {
        if (torrent && indexNum !== null && !isNaN(indexNum)) {
            setTorrentData(torrent[indexNum] ?? null);
        } else {
            setTorrentData(null);
        }
    }, [torrent, indexNum]);
    const tabsType = [
        "General",
        "Trackers",
        "Peers",
        "HTTP Sources",
        "Content",
        "Speed",
    ] as const;

    const [tabs, setTabs] = useState<(typeof tabsType)[number]>("General");

    if (keys.length > 1) {
        return <div ref={cardRef}>Error: More than one row selected</div>;
    }
    if (keys.length === 0 || torrentData === null) {
        return (
            <div
                ref={cardRef}
                className="flex justify-center rounded-md border p-64"
            >
                No torrent selected
            </div>
        );
    }

    return (
        <Card className="w-full" ref={cardRef}>
            <CardContent className="space-y-6 pt-6">
                {/* Tabs switch defined here  */}
                {tabs === "General" && <GeneralTab torrentData={torrentData} />}
                {tabs === "Trackers" && (
                    <TrackersTab torrentData={torrentData} />
                )}
                {/* Tabs */}
                <Tabs defaultValue="general" className="border-t pt-4">
                    <TabsList>
                        {tabsType.map((tab) => (
                            <TabsTrigger
                                key={tab}
                                value={tab.toLowerCase().replace(/\s+/g, "-")}
                                onClick={() => setTabs(tab)}
                            >
                                {tab}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>
            </CardContent>
        </Card>
    );
}
