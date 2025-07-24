export function isGlobalIP(ip: string) {
    // IPv4 private ranges
    const privateIPv4Ranges = [
        /^10\./, // 10.0.0.0 – 10.255.255.255
        /^172\.(1[6-9]|2\d|3[0-1])\./, // 172.16.0.0 – 172.31.255.255
        /^192\.168\./, // 192.168.0.0 – 192.168.255.255
        /^127\./, // 127.0.0.0 – 127.255.255.255 (loopback)
    ];

    // IPv6 private ranges
    // fc00::/7 (Unique local addresses) and ::1 (loopback)
    const privateIPv6Ranges = [
        /^::1$/, // loopback
        /^fc00:/, // Unique local address range
        /^fd00:/, // Unique local address range
    ];

    if (ip.includes(".")) {
        // IPv4 check
        if (privateIPv4Ranges.some((regex) => regex.test(ip))) {
            return false; // local IP
        }
        return true; // global IP
    } else if (ip.includes(":")) {
        // IPv6 check
        if (privateIPv6Ranges.some((regex) => regex.test(ip))) {
            return false; // local IP
        }
        return true; // global IP
    } else {
        throw new Error("Invalid IP address format");
    }
}
