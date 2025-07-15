export interface MagnetResponse {
  status: "success" | "error";
  message: string;
  metadata?: {
    name: string;
    comment: string;
    creator: string;
    info_hash: string;
    // info_hash_v2?: string; // optional if used
    total_size: number;
    piece_length: number;
    num_pieces: number;
    is_private: boolean;
    creation_date: number;
    num_files: number;
    metadata_size: number;

    files: Array<{
      index: number;
      path: string;
      size: number;
      offset: number;
      // mtime?: number | null; // optional if used
    }>;

    trackers: Array<{
      url: string;
      tier: number;
      fail_limit: number;
      source: number;
      verified: boolean;
    }>;

    nodes: Array<{
      host: string;
      port: number;
    }>;

    url_seeds: string[];
    http_seeds: string[];
  };
}
