export function parseCustomPathname({
    currentPathname,
    relativeUrl,
}: {
    currentPathname: string;
    relativeUrl: string;
}) {
    const segments = currentPathname.split("/").filter(Boolean);
    const base = segments.length ? "/" + segments[0] : "";

    if (relativeUrl.startsWith("./")) {
        return base + "/" + relativeUrl.slice(2);
    }
    return relativeUrl;
}
