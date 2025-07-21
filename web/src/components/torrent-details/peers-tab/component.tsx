"use client";

import { useEffect, useRef, useState } from "react";
import { PeerTabDataTable } from "./data-table";
import { columns } from "./columns";
import { TorrentInfo, Peer } from "@/types/socket/torrent_info";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getCountryISOFromIp } from "@/lib/getCountryISOFromIp";
import { isValidIP } from "@/lib/isValidIp";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { useSocketConnection } from "@/hooks/use-socket";

export default function PeersTab({
    torrentData,
}: {
    torrentData: TorrentInfo;
}) {
    const [rawPeers, setRawPeers] = useState<Peer[]>([]);
    const [enrichedPeers, setEnrichedPeers] = useState<Peer[]>([]);
    const [loading, setLoading] = useState(false);
    const hasLoadedOnce = useRef(false);
    const enrichmentCache = useRef(new Map<string, string | null>());

    const { ref, isIntersecting } = useIntersectionObserver<HTMLDivElement>({
        threshold: 0.5,
    });

    const socket = useSocketConnection();

    useEffect(() => {
        if (!isIntersecting) return;

        let mounted = true;

        async function fetchAndEnrichLoop() {
            while (mounted) {
                if (!hasLoadedOnce.current) {
                    setLoading(true);
                }

                const peers = await new Promise<Peer[]>((resolve) => {
                    socket.current?.emit(
                        "libtorrent:get_specific_peers",
                        { info_hash: torrentData.info_hash },
                        (response: {
                            status: "success" | "error";
                            peers: Peer[];
                        }) => {
                            if (response.status === "success") {
                                resolve(response.peers);
                            } else {
                                resolve([]);
                            }
                        },
                    );
                });

                if (!mounted) break;

                setRawPeers(peers);

                if (peers.length > 0) {
                    const enriched = await Promise.all(
                        peers.map(async (peer) => {
                            const ip = peer.ip;

                            if (!isValidIP(ip)) {
                                return { ...peer, isoCode: null };
                            }

                            if (enrichmentCache.current.has(ip)) {
                                return {
                                    ...peer,
                                    isoCode: enrichmentCache.current.get(ip),
                                };
                            }

                            try {
                                const isoCode = await getCountryISOFromIp(ip);
                                enrichmentCache.current.set(ip, isoCode);
                                return { ...peer, isoCode };
                            } catch (e) {
                                console.warn("Could not fetch ISO for", ip, e);
                                enrichmentCache.current.set(ip, null);
                                return { ...peer, isoCode: null };
                            }
                        }),
                    );

                    if (!mounted) break;

                    setEnrichedPeers(enriched);
                } else {
                    setEnrichedPeers([]);
                }

                if (!hasLoadedOnce.current) {
                    setLoading(false);
                    hasLoadedOnce.current = true;
                }

                // Wait some time before next fetch to avoid spamming server
                // Adjust delay as needed (e.g., 1 second)
                await new Promise((res) => setTimeout(res, 1000));
            }
        }

        fetchAndEnrichLoop();

        return () => {
            mounted = false;
        };
    }, [socket, isIntersecting, torrentData.info_hash]);

    return (
        <ScrollArea ref={ref} className="h-96">
            {loading ? (
                <div className="flex h-full items-center justify-center text-gray-500">
                    Loading peers...
                </div>
            ) : (
                <PeerTabDataTable data={enrichedPeers} columns={columns} />
            )}
        </ScrollArea>
    );
}
