"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useAtomValue, useSetAtom } from "jotai";
import { torrentAtom } from "@/atoms/torrent";
import { selectedRowAtom, ignoredElementsRefAtom } from "@/atoms/table";
import { TorrentInfo } from "@/types/socket/torrent_info";
import { Fragment, RefObject, useEffect, useRef, useState } from "react";
import { formatBytes } from "@/lib/formatBytes";
import { calculateETA } from "@/lib/calculateEta";
import { formatDurationClean } from "@/lib/formatDurationClean";

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
        nextAnnounce: formatDurationClean(torrentData?.next_announce || 0),
        uploadSpeed: formatBytes({
            bytes: torrentData?.upload_rate || 0,
            perSecond: true,
        }),
        eta: formatDurationClean(
            torrentData && (torrentData.progress || 0) < 100
                ? (calculateETA({
                      downloaded: Number(
                          (torrentData.total_size ?? 0) *
                              (torrentData.progress / 100),
                      ),
                      total: torrentData.total_size ?? 0,
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
        pieceLength: `${torrentData?.num_pieces} x ${formatBytes({
            bytes: torrentData?.piece_length || 0,
        })}`,
    };

    // Data arrays for the 3 tables in upper section
    const tableData1 = [
        ["Time Active", mapping.activeTime],
        ["Downloaded", mapping.downloaded],
        ["Download Speed", mapping.downloadSpeed],
        ["Download Limit", "∞"],
        ["Share Ratio", mapping.shareRatio],
        ["Popularity", "16.12"],
    ];

    const tableData2 = [
        ["ETA", mapping.eta],
        ["Uploaded", mapping.uploaded],
        ["Upload Speed", mapping.uploadSpeed],
        ["Upload Limit", "∞"],
        ["Reannounce In", mapping.nextAnnounce],
    ];

    const tableData3 = [
        ["Connections", "0 (∞ max)"],
        ["Seeds", "0 (0 total)"],
        ["Peers", "0 (100 total)"],
        ["Wasted", mapping.wastedBytes],
        ["Last Seen Complete", mapping.completionTime],
    ];

    // Info Section rows (some have colspan for value)
    const infoRows = [
        [
            ["Total Size", mapping.totalSize],
            ["Pieces", mapping.pieceLength],
        ],
        [
            ["Added On", mapping.addedTime],
            ["Completed On", mapping.completionTime],
        ],
        [
            ["Private", mapping.private],
            ["Created By", mapping.createdBy],
        ],
        [["Info Hash v1", mapping.infoHash, 4]],
        [["Info Hash v2", mapping.infoHashV2, 4]],
        [["Save Path", mapping.savePath, 4]],
        [["Comment", mapping.comments, 4]],
        [["Created On", mapping.creationDate, 4]],
    ];

    const renderLabelValue = (
        label: string | number | undefined,
        value: any,
        colSpan: string | number = 1,
    ) => {
        const colSpanValue =
            typeof colSpan === "string" ? Number(colSpan) : colSpan;

        return (
            <Fragment>
                <td className="w-0 text-right whitespace-nowrap">{label}</td>
                <td className="w-0 px-1 text-center">:</td>
                <td className="font-semibold" colSpan={colSpanValue}>
                    {value}
                </td>
            </Fragment>
        );
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

                {/* Transfer Info in 3 separate tables */}
                <div className="grid grid-cols-3 gap-6 border-b pb-4 text-sm">
                    {[tableData1, tableData2, tableData3].map(
                        (tableData, i) => (
                            <table key={i} className="w-full table-auto">
                                <tbody>
                                    {tableData.map(([label, value], idx) => (
                                        <tr key={idx}>
                                            <td className="w-0 text-right whitespace-nowrap">
                                                {label}
                                            </td>
                                            <td className="w-0 px-1 text-center">
                                                :
                                            </td>
                                            <td className="font-semibold">
                                                {value}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ),
                    )}
                </div>

                {/* Info Section */}
                <table className="w-full table-auto text-sm">
                    <tbody>
                        {infoRows.map((row, i) => (
                            <tr key={i}>
                                {row.length === 1
                                    ? renderLabelValue(
                                          row[0][0],
                                          row[0][1],
                                          row[0][2] ?? 1,
                                      )
                                    : row.map(([label, value], idx) => (
                                          <Fragment
                                              key={label?.toString() || idx}
                                          >
                                              {renderLabelValue(
                                                  label,
                                                  value,
                                                  1,
                                              )}
                                          </Fragment>
                                      ))}
                            </tr>
                        ))}
                    </tbody>
                </table>

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
