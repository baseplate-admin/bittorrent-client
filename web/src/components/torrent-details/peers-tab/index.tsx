"use client";

import { useEffect, useRef, useState } from "react";
import { PeerTabDataTable } from "./data-table";
import { columns } from "./columns";
import { Peer } from "@/types/socket/torrent_info";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getCountryISOFromIp } from "@/lib/getCountryISOFromIp";
import { isValidIP } from "@/lib/isValidIp";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { useSocketConnection } from "@/hooks/use-socket";
import PeersTabLoading from "./loading";

type EnrichedPeer = Peer & {
    isoCode?: string;
    country?: string;
};

export default function PeersTab({ infoHash }: { infoHash: string }) {
    const [enrichedPeers, setEnrichedPeers] = useState<EnrichedPeer[]>([]);
    const [loading, setLoading] = useState(false);
    const hasLoadedOnce = useRef(false);
    const enrichmentCache = useRef(
        new Map<string, { isoCode?: string; country?: string } | undefined>(),
    );

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
                        { info_hash: infoHash },
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

                if (peers.length > 0) {
                    const enriched = await Promise.all(
                        peers.map(async (peer) => {
                            const ip = peer.ip;

                            if (!isValidIP(ip)) {
                                return {
                                    ...peer,
                                    isoCode: undefined,
                                    country: undefined,
                                };
                            }

                            if (enrichmentCache.current.has(ip)) {
                                const cached = enrichmentCache.current.get(ip);
                                return {
                                    ...peer,
                                    isoCode: cached?.isoCode ?? undefined,
                                    country: cached?.country ?? undefined,
                                };
                            }

                            try {
                                const geoInfo = await getCountryISOFromIp(ip);
                                enrichmentCache.current.set(ip, {
                                    isoCode: geoInfo?.isoCode ?? undefined,
                                    country: geoInfo?.country ?? undefined,
                                });
                                return {
                                    ...peer,
                                    isoCode: geoInfo?.isoCode ?? undefined,
                                    country: geoInfo?.country ?? undefined,
                                };
                            } catch (e) {
                                console.warn("Could not fetch ISO for", ip, e);
                                enrichmentCache.current.set(ip, undefined);
                                return {
                                    ...peer,
                                    isoCode: undefined,
                                    country: undefined,
                                };
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

                await new Promise((res) => setTimeout(res, 1000));
            }
        }

        fetchAndEnrichLoop();

        return () => {
            mounted = false;
        };
    }, [socket, isIntersecting, infoHash]);

    return (
        <ScrollArea ref={ref} className="h-96">
            {loading ? (
                <PeersTabLoading />
            ) : (
                <PeerTabDataTable data={enrichedPeers} columns={columns} />
            )}
        </ScrollArea>
    );
}
