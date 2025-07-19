"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useAtomValue, useSetAtom } from "jotai";
import { torrentAtom } from "@/atoms/torrent";
import { selectedRowAtom } from "@/atoms/table";
import { TorrentInfo } from "@/types/socket/torrent_info";
import { RefObject, useEffect, useRef, useState } from "react";
import { formatBytes } from "@/lib/formatBytes";
import { calculateETA } from "@/lib/calculateEta";
import { formatDurationClean } from "@/lib/formatDurationClean";
import { ignoredElementsRefAtom } from "@/atoms/table";

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
    const mapping = {
        addedTime: new Date(
            (torrentData?.added_time || 0) * 1000,
        ).toLocaleString(),
        completionTime: torrentData?.completion_time
            ? new Date(torrentData.completion_time * 1000).toLocaleString()
            : "—",
        savePath: torrentData?.save_path || "N/A",
        activeTime: formatDurationClean(torrentData?.active_time || 0),
        creationDate: torrentData?.creation_date ?? "—",
        createdBy: torrentData?.creator ?? "—",
        comments:
            torrentData?.comment === ""
                ? "<Empty String>"
                : (torrentData?.comment ?? "N/A"),
        progress: torrentData?.progress || 0,
        downloaded: formatBytes({ bytes: torrentData?.downloaded || 0 }),
        uploaded: formatBytes({ bytes: torrentData?.uploaded || 0 }),
        infoHash: torrentData?.info_hash,
        infoHashV2: torrentData?.info_hash_v2 || "N/A",
        downloadSpeed: formatBytes({
            bytes: torrentData?.download_rate || 0,
            perSecond: true,
        }),
        uploadSpeed: formatBytes({
            bytes: torrentData?.upload_rate || 0,
            perSecond: true,
        }),
        eta: formatDurationClean(
            torrentData && (torrentData.progress || 0) < 100
                ? (calculateETA({
                      downloaded: Number(
                          torrentData.total_size * (torrentData.progress / 100),
                      ),
                      total: torrentData.total_size,
                      downloadSpeed: torrentData.download_rate,
                  }) ?? Infinity)
                : Infinity,
        ),
        shareRatio: torrentData?.share_ratio,
        totalSize: formatBytes({ bytes: torrentData?.total_size || 0 }),
        wastedBytes: formatBytes({ bytes: torrentData?.wasted || 0 }) ?? 0,
        private:
            typeof torrentData?.is_private === "boolean"
                ? String(torrentData.is_private)
                : undefined,
        pieceLength: `${torrentData?.num_pieces} x ${formatBytes({ bytes: torrentData?.piece_length || 0 })}`,
    };

    if (keys.length > 1) {
        return <div ref={cardRef}>Error: More than one row selected</div>;
    }
    if (keys.length === 0) {
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
                {/* Progress */}
                <div>
                    <div className="mb-1 text-sm font-medium">Progress:</div>
                    <Progress value={mapping.progress} className="h-2" />
                </div>

                {/* Transfer Section */}
                <div className="grid grid-cols-3 gap-6 border-b pb-4 text-sm">
                    <div className="space-y-1">
                        <div>
                            Time Active:{" "}
                            <span className="font-semibold">
                                {mapping.activeTime}
                            </span>
                        </div>
                        <div>
                            Downloaded:{" "}
                            <span className="font-semibold">
                                {mapping.downloaded}
                            </span>
                        </div>
                        <div>
                            Download Speed:{" "}
                            <span className="font-semibold">
                                {mapping.downloadSpeed}
                            </span>
                        </div>
                        <div>
                            Download Limit:{" "}
                            <span className="font-semibold">∞</span>
                        </div>
                        <div>
                            Share Ratio:{" "}
                            <span className="font-semibold">
                                {mapping.shareRatio}
                            </span>
                        </div>
                        <div>
                            Popularity:{" "}
                            <span className="font-semibold">16.12</span>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <div>
                            ETA:{" "}
                            <span className="font-semibold">
                                {mapping.eta}{" "}
                            </span>
                        </div>
                        <div>
                            Uploaded:{" "}
                            <span className="font-semibold">
                                {mapping.uploaded}
                            </span>
                        </div>
                        <div>
                            Upload Speed:{" "}
                            <span className="font-semibold">
                                {mapping.uploadSpeed}
                            </span>
                        </div>
                        <div>
                            Upload Limit:{" "}
                            <span className="font-semibold">∞</span>
                        </div>
                        <div>
                            Reannounce In:{" "}
                            <span className="font-semibold">0</span>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <div>
                            Connections:{" "}
                            <span className="font-semibold">0 (∞ max)</span>
                        </div>
                        <div>
                            Seeds:{" "}
                            <span className="font-semibold">0 (0 total)</span>
                        </div>
                        <div>
                            Peers:{" "}
                            <span className="font-semibold">0 (100 total)</span>
                        </div>
                        <div>
                            Wasted:{" "}
                            <span className="font-semibold">
                                {mapping.wastedBytes}
                            </span>
                        </div>
                        <div>
                            Last Seen Complete:{" "}
                            <span className="font-semibold">
                                {mapping.completionTime}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Info Section */}
                <div className="grid grid-cols-2 gap-6 text-sm">
                    <div className="space-y-1">
                        <div>
                            Total Size:{" "}
                            <span className="font-semibold">
                                {mapping.totalSize}
                            </span>
                        </div>
                        <div>
                            Added On:{" "}
                            <span className="font-semibold">
                                {mapping.addedTime}
                            </span>
                        </div>
                        <div>
                            Private:{" "}
                            <span className="font-semibold capitalize">
                                {mapping.private}
                            </span>
                        </div>
                        <div>
                            Info Hash v1:{" "}
                            <span className="font-semibold break-all">
                                {mapping.infoHash}
                            </span>
                        </div>
                        <div>
                            Info Hash v2:{" "}
                            <span className="font-semibold">
                                {mapping.infoHashV2}
                            </span>
                        </div>
                        <div>
                            Save Path:{" "}
                            <span className="font-semibold">
                                {mapping.savePath}
                            </span>
                        </div>
                        <div>
                            Comment:{" "}
                            <span className="font-semibold">
                                {mapping.comments}
                            </span>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <div>
                            Pieces:{" "}
                            <span className="font-semibold">
                                {mapping.pieceLength}
                            </span>
                        </div>
                        <div>
                            Completed On:{" "}
                            <span className="font-semibold">
                                {mapping.completionTime}
                            </span>
                        </div>
                        <div>
                            Created By:{" "}
                            <span className="font-semibold">
                                {mapping.createdBy}
                            </span>
                        </div>
                        <div>
                            Created On:{" "}
                            <span className="font-semibold">
                                {mapping.creationDate}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="general" className="border-t pt-4">
                    <TabsList>
                        {[
                            "General",
                            "Trackers",
                            "Peers",
                            "HTTP Sources",
                            "Content",
                            "Speed",
                        ].map((tab) => (
                            <TabsTrigger
                                key={tab}
                                value={tab.toLowerCase().replace(/\s+/g, "-")}
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
