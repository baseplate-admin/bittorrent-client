"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAtomValue, useSetAtom } from "jotai";
import { broadcastTorrentAtom } from "@/atoms/torrent";
import { selectedRowAtom, ignoredElementsRefAtom } from "@/atoms/table";
import { BroadcastTorrentInfo } from "@/types/socket/torrent_info";
import { RefObject, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { Separator } from "../ui/separator";
import dynamic from "next/dynamic";

// Tabs import
const GeneralTab = dynamic(() => import("./general-tab"));
const TrackersTab = dynamic(() => import("./tracker-tab"));
const PeersTab = dynamic(() => import("./peers-tab"));

export default function TorrentDetails() {
    const torrent = useAtomValue(broadcastTorrentAtom);
    const selectedRows = useAtomValue(selectedRowAtom);
    const setIgnoredElementsRef = useSetAtom(ignoredElementsRefAtom);

    const cardRef = useRef<HTMLDivElement>(null);
    const [torrentData, setTorrentData] = useState<BroadcastTorrentInfo | null>(
        null,
    );
    const [selectedTabIndex, setSelectedTabIndex] = useState<number>(0);

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

    const tabs = [
        { label: "General", component: GeneralTab },
        { label: "Trackers", component: TrackersTab },
        { label: "Peers", component: PeersTab },
    ] as const;

    return (
        <Card className="w-full" ref={cardRef}>
            <CardContent className="space-y-6 pt-6">
                {/* Render all tab components but only show the selected one */}
                {tabs.map(({ component: TabComponent }, i) => (
                    <div
                        key={i}
                        className={cn(
                            selectedTabIndex === i ? "block" : "hidden",
                        )}
                    >
                        <TabComponent
                            infoHash={torrentData.info_hash}
                            averageDownloadSpeed={
                                torrentData.average_download_speed
                            }
                            averageUploadSpeed={
                                torrentData.average_upload_speed
                            }
                        />
                    </div>
                ))}
                <Separator className="my-4" />
                <Tabs
                    value={String(selectedTabIndex)}
                    onValueChange={(v) => setSelectedTabIndex(Number(v))}
                >
                    <TabsList>
                        {tabs.map((tab, i) => (
                            <TabsTrigger key={i} value={String(i)}>
                                {tab.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>
            </CardContent>
        </Card>
    );
}
