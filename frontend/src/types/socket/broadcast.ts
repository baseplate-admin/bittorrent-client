export type SerializedAlert =
  | { type: "torrent_finished"; message: string }
  | { type: "metadata_received"; message: string }
  | { type: "peer_connected"; message: string } // IP string
  | {
      type: "state_update";
      statuses: {
        name: string;
        progress: number;
        download_rate: number;
        upload_rate: number;
        num_peers: number;
        state: number;
      }[];
    }
  | {
      type: "tracker_error";
      message: string;
      url: string;
      error: string;
    }
  | {
      type: "add_torrent";
      message: string;
      info_hash: string | null;
    }
  | {
      type: "udp_error";
      message: string;
      endpoint: string;
    }
  | {
      type: "dht_stats";
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
      type: "session_stats_header";
      counters: string[];
    }
  | {
      type: "session_stats";
      values: number[];
    };

export interface BroadcastResponse {
  status: "success" | "error";
  message: string;
}