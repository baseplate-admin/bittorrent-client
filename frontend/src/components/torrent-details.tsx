"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useAtomValue } from "jotai";
import { torrentAtom } from "@/atoms/torrent";
import { selectedRowAtom } from "@/atoms/table";
import { TorrentInfo } from "@/types/socket/torrent_info";
import { useEffect, useState } from "react";
import { formatBytes } from "@/lib/formatBytes";
import { calculateETA } from "@/lib/calculateEta";
import { formatDurationClean } from "@/lib/formatDurationClean";

export default function TorrentDetails() {
    const torrent = useAtomValue(torrentAtom);
    const selectedRows = useAtomValue(selectedRowAtom);

    const [torrentData, setTorrentData] = useState<TorrentInfo | null>(null);

    const keys = Object.keys(selectedRows || {});

    const index = keys.length === 1 ? keys[0] : null;
    const indexNum = index !== null ? parseInt(index, 10) : null;

    useEffect(() => {
        if (torrent && indexNum !== null && !isNaN(indexNum)) {
            setTorrentData(torrent[indexNum] ?? null);
            console.log("Torrent Data:", torrent[indexNum]);
        } else {
            setTorrentData(null);
        }
    }, [torrent, indexNum]);

    if (keys.length > 1) {
        return <>Error: More than one row selected</>;
    }
    if (keys.length === 0) {
        return (
            <div className="flex justify-center rounded-md border p-64">
                No torrent selected
            </div>
        );
    }

    const mapping = {
        addedTime: torrentData?.added_time,
        completionTime: torrentData?.completion_time,
        comments: torrentData?.comment,
        progress: torrentData?.progress || 0,
        timeActive: "20h 42m",
        downloaded: "0 B",
        infoHash: torrentData?.info_hash,
        downloadSpeed: formatBytes({
            bytes: torrentData?.download_rate || 0,
            perSecond: true,
        }),
        uploadSpeed: formatBytes({
            bytes: torrentData?.upload_rate || 0,
            perSecond: true,
        }),
        eta: torrentData
            ? calculateETA({
                  downloaded: Number(
                      torrentData.total_size * (torrentData.progress / 100),
                  ),
                  total: torrentData.total_size,
                  downloadSpeed: torrentData.download_rate,
              })
            : null,
        shareRatio: torrentData?.share_ratio,
        totalSize: torrentData?.total_size,
    };

    return (
        <Card className="w-full">
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
                                {mapping.timeActive}
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
                                {formatDurationClean(
                                    mapping.progress < 100
                                        ? (mapping.eta ?? Infinity)
                                        : Infinity,
                                )}{" "}
                            </span>
                        </div>
                        <div>
                            Uploaded:{" "}
                            <span className="font-semibold">14.03 GiB</span>
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
                            Wasted: <span className="font-semibold">0 B</span>
                        </div>
                        <div>
                            Last Seen Complete:{" "}
                            <span className="font-semibold">
                                {new Date(
                                    (mapping.completionTime || 0) * 1000,
                                ).toLocaleString()}
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
                                {formatBytes({
                                    bytes: mapping.totalSize || 0,
                                })}
                            </span>
                        </div>
                        <div>
                            Added On:{" "}
                            <span className="font-semibold">
                                {new Date(
                                    (mapping.addedTime || 0) * 1000,
                                ).toLocaleString()}
                            </span>
                        </div>
                        <div>
                            Private: <span className="font-semibold">No</span>
                        </div>
                        <div>
                            Info Hash v1:{" "}
                            <span className="font-semibold break-all">
                                {mapping.infoHash}
                            </span>
                        </div>
                        <div>
                            Info Hash v2:{" "}
                            <span className="font-semibold">N/A</span>
                        </div>
                        <div>
                            Save Path:{" "}
                            <span className="font-semibold">E:\Torrent</span>
                        </div>
                        <div>
                            Comment:{" "}
                            <span className="font-semibold">
                                {mapping.comments || (
                                    <span className="italic">No comments</span>
                                )}
                            </span>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <div>
                            Pieces:{" "}
                            <span className="font-semibold">
                                16174 x 2.0 MiB (have 0)
                            </span>
                        </div>
                        <div>
                            Completed On:{" "}
                            <span className="font-semibold">
                                7/6/2025 12:30 AM
                            </span>
                        </div>
                        <div>
                            Created By: <span className="font-semibold">—</span>
                        </div>
                        <div>
                            Created On: <span className="font-semibold">—</span>
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
