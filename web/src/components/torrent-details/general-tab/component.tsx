"use client";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { calculateETA } from "@/lib/calculateEta";
import { formatBytes } from "@/lib/formatBytes";
import { formatDurationClean } from "@/lib/formatDurationClean";
import { TorrentInfo } from "@/types/socket/torrent_info";
import { Fragment, useRef, useState } from "react";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { TOOLTIP_DELAY } from "@/consts/tooltip";
export default function GeneralTab({
    torrentData,
}: {
    torrentData: TorrentInfo;
}) {
    const [tooltipOpen, setTooltipOpen] = useState(false);
    const hoverTimeout = useRef<NodeJS.Timeout | null>(null);

    // Handlers for delayed tooltip
    const handleMouseEnter = () => {
        hoverTimeout.current = setTimeout(() => {
            setTooltipOpen(true);
        }, TOOLTIP_DELAY); // 2000ms = 2 seconds delay
    };

    const handleMouseLeave = () => {
        if (hoverTimeout.current) {
            clearTimeout(hoverTimeout.current);
            hoverTimeout.current = null;
        }
        setTooltipOpen(false);
    };

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
        nextAnnounce:
            torrentData?.next_announce > 0
                ? formatDurationClean(torrentData?.next_announce || 0)
                : "Announce in progress",
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
        shareRatio:
            torrentData?.uploaded && torrentData?.downloaded
                ? (torrentData.uploaded / torrentData.downloaded).toFixed(2)
                : "N/A",
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
    return (
        <>
            <div>
                <div className="mb-1 text-sm font-medium">Progress:</div>
                <Tooltip open={tooltipOpen}>
                    <TooltipTrigger
                        asChild
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                    >
                        <Progress
                            value={mapping.progress}
                            className="h-6 rounded-sm"
                        />
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{mapping.progress.toFixed(2)}%</p>
                    </TooltipContent>
                </Tooltip>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-6 text-sm">
                {[tableData1, tableData2, tableData3].map((tableData, i) => (
                    <table key={i} className="w-full table-auto">
                        <tbody>
                            {tableData.map(([label, value], idx) => (
                                <tr key={idx}>
                                    <td className="w-0 text-right whitespace-nowrap">
                                        {label}
                                    </td>
                                    <td className="w-0 px-1 text-center">:</td>
                                    <td className="font-semibold">{value}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ))}
            </div>
            <Separator className="my-4" />

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
                                      <Fragment key={label?.toString() || idx}>
                                          {renderLabelValue(label, value, 1)}
                                      </Fragment>
                                  ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </>
    );
}
