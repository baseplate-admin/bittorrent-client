import { Controller, Get } from '@nestjs/common';
import { TorrentService } from './torrent.service';

@Controller()
export class TorrentController {
  constructor(private readonly torrentService: TorrentService) {}

  @Get()
  getHello(): string {
    return this.torrentService.getHello();
  }
}
