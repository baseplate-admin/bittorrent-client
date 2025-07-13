import { Module } from '@nestjs/common';
import { TorrentService } from './torrent.service';
import { TorrentGateway } from './torrent.gateway';

@Module({
  imports: [],
  controllers: [],
  providers: [TorrentService, TorrentGateway],
})
export class TorrentModule {}
