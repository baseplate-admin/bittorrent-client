"use client";

import { useEffect, useState } from "react";
import { PeerTabDataTable } from "./data-table";
import { columns } from "./columns";
import { TorrentInfo, Peer } from "@/types/socket/torrent_info";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getCountryISOFromIp } from "@/lib/getCountryISOFromIp";
import { isValidIP } from "@/lib/isValidIp";

export default function PeersTab({}) {
    return <div></div>;
}

// export default function PeersTab({}: {}) {
//     const [enrichedPeers, setEnrichedPeers] = useState<Peer[]>([]);

//     useEffect(() => {
//         async function enrich() {
//             const enriched = await Promise.all(
//                 torrentData.peers.map(async (peer) => {
//                     const ip = peer.ip;
//                     let isoCode = null;

//                     if (isValidIP(ip)) {
//                         try {
//                             isoCode = await getCountryISOFromIp(ip);
//                         } catch (e) {
//                             console.warn("Could not fetch ISO for", ip, e);
//                         }
//                     } else {
//                         console.warn("Invalid IP address:", ip);
//                     }

//                     return { ...peer, isoCode };
//                 }),
//             );
//             setEnrichedPeers(enriched);
//         }

//         enrich();
//     }, [torrentData.peers]);

//     return (
//         <ScrollArea className="h-96">
//             <PeerTabDataTable data={enrichedPeers} columns={columns} />
//         </ScrollArea>
//     );
// }
