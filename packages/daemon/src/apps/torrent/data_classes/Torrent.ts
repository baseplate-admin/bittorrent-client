import { Worker } from 'worker_threads';

export class TorrentDataObject {
  constructor(
    public name: string,
    public files: { name: string; length: number }[],
    public infoHash: string,
    public totalSize: number,
    public numFiles: number,
    public worker: Worker,
    public progress: number,
  ) {}

  setProgress(progress: number) {
    this.progress = progress;
  }
}
