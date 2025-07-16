export function formatBytes({
    bytes,
    decimals = 2,
    perSecond = false,
}: {
    bytes: number;
    decimals?: number;
    perSecond?: boolean;
}): string {
    if (bytes === 0) return perSecond ? "0 B/s" : "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const size = parseFloat((bytes / Math.pow(k, i)).toFixed(decimals));
    const unit = sizes[i];

    return `${size} ${unit}${perSecond ? "/s" : ""}`;
}
