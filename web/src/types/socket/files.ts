export interface FileInfo {
    index: number;
    path: string;
    size: number;
    offset: number;
    progress: number;
    remaining: number;
    priority: number;
    name: string;
}
