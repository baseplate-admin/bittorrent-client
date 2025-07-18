import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

export default function TorrentDetails() {
    return (
        <Card className="w-full">
            <CardContent className="space-y-6 pt-6">
                {/* Progress */}
                <div>
                    <div className="mb-1 text-sm font-medium">Progress:</div>
                    <Progress value={0} className="h-2" />
                </div>

                {/* Transfer Section */}
                <div className="grid grid-cols-3 gap-6 border-b pb-4 text-sm">
                    <div className="space-y-1">
                        <div>
                            Time Active:{" "}
                            <span className="font-semibold">20h 4m</span>
                        </div>
                        <div>
                            Downloaded:{" "}
                            <span className="font-semibold">31.58 GiB</span>
                        </div>
                        <div>
                            Download Speed:{" "}
                            <span className="font-semibold">
                                0 B/s (2.0 MiB/s avg.)
                            </span>
                        </div>
                        <div>
                            Download Limit:{" "}
                            <span className="font-semibold">∞</span>
                        </div>
                        <div>
                            Share Ratio:{" "}
                            <span className="font-semibold">0.44</span>
                        </div>
                        <div>
                            Popularity:{" "}
                            <span className="font-semibold">16.12</span>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <div>
                            ETA: <span className="font-semibold">∞</span>
                        </div>
                        <div>
                            Uploaded:{" "}
                            <span className="font-semibold">14.03 GiB</span>
                        </div>
                        <div>
                            Upload Speed:{" "}
                            <span className="font-semibold">
                                0 B/s (203.7 KiB/s avg.)
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
                                7/6/2025 3:16 PM
                            </span>
                        </div>
                    </div>
                </div>

                {/* Info Section */}
                <div className="grid grid-cols-2 gap-6 text-sm">
                    <div className="space-y-1">
                        <div>
                            Total Size:{" "}
                            <span className="font-semibold">31.58 GiB</span>
                        </div>
                        <div>
                            Added On:{" "}
                            <span className="font-semibold">
                                7/5/2025 8:10 PM
                            </span>
                        </div>
                        <div>
                            Private: <span className="font-semibold">No</span>
                        </div>
                        <div>
                            Info Hash v1:{" "}
                            <span className="font-semibold break-all">
                                380bdebd8c5e1bb2b56817901db258e7deb3c6a06
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
                            Comment: <span className="font-semibold">—</span>
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
