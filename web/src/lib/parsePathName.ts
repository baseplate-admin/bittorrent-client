function parseCustomPathname(relativePath: string): string {
    if (relativePath.startsWith("./")) {
        return "/" + relativePath.slice(2);
    }
    return relativePath;
}
