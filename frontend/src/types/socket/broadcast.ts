export type SerializedAlert =
    | { type: "libtorrent:torrent_finished"; message: string }
    | { type: "libtorrent:metadata_received"; message: string }
    | { type: "libtorrent:peer_connected"; message: string } // IP string
    | {
          type: "libtorrent:state_update";
          statuses: {
              name: string;
              progress: number;
              download_rate: number;
              upload_rate: number;
              info_hash: string;
              num_peers: number;
              state: string;
              seeders: number;
              total_size: number;
          }[];
      }
    | {
          type: "libtorrent:tracker_error";
          message: string;
          url: string;
          error: string;
      }
    | {
          type: "libtorrent:add_torrent";
          message: string;
          info_hash: string;
      }
    | {
          type: "libtorrent:udp_error";
          message: string;
          endpoint: string;
      }
    | {
          type: "libtorrent:dht_stats";
          active_requests: {
              type: number;
              outstanding_requests: number;
              timeouts: number;
              responses: number;
              branch_factor: number;
              nodes_left: number;
              last_sent: number;
              first_timeout: number;
          }[];
          routing_table: {
              num_nodes: number;
              num_replacements: number;
          }[];
      }
    | {
          type: "libtorrent:session_stats_header";
          counters: string[];
      }
    | {
          type: "libtorrent:session_stats";
          values: number[];
      };

export interface BroadcastResponse {
    status: "success" | "error";
    message: string;
}
