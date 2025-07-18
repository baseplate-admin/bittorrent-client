export function calculateETA({
    downloaded,
    total,
    downloadSpeed,
}: {
    downloaded: number;
    total: number;
    downloadSpeed: number;
}) {
    if (
        typeof downloaded !== "number" ||
        typeof total !== "number" ||
        typeof downloadSpeed !== "number"
    ) {
        throw new Error("All inputs must be numbers");
    }

    const remaining = total - downloaded;

    if (downloadSpeed > 0) {
        return remaining / downloadSpeed;
    } else {
        return Infinity;
    }
}
