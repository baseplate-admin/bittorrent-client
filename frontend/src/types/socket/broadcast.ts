export type SerializedAlert =
    | { type: "synthetic:resumed"; info_hash: string }
    | { type: "synthetic:paused"; info_hash: string }
    | { type: "synthetic:removed"; info_hash: string }
    | { type: "libtorrent:torrent_finished"; message: string }
    | { type: "libtorrent:metadata_received"; message: string }
    | { type: "libtorrent:peer_connected"; message: string } // IP string
    | {
          type: "libtorrent:state_update";
          statuses: {
              name: string;
              progress: number; // percent (0-100)
              download_rate: number; // bytes/sec
              upload_rate: number; // bytes/sec
              info_hash: string;
              num_peers: number;
              seeds: number;
              leechers?: number; // optional
              state: string;
              total_size: number;
              peers?: {
                  ip: string;
                  progress: number;
                  total_download: number;
                  total_upload: number;
                  is_seed: boolean;
              }[];
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
