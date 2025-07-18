export function formatDurationClean(seconds: number): string {
    if (!Number.isFinite(seconds)) {
        if (seconds === Infinity) return "∞";
        if (seconds === -Infinity) return "-∞";
        return "invalid";
    }

    const abs = Math.abs(seconds);
    const units = [
        { unit: "day", seconds: 86400 },
        { unit: "hour", seconds: 3600 },
        { unit: "minute", seconds: 60 },
        { unit: "second", seconds: 1 },
    ];

    for (const { unit, seconds: unitSeconds } of units) {
        const value = Math.floor(abs / unitSeconds);
        if (value >= 1) {
            return `${value} ${unit}${value !== 1 ? "s" : ""}`;
        }
    }

    return "0 seconds";
}
