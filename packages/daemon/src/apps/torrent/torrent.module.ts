import { Module } from '@nestjs/common';
import { TorrentService } from './torrent.service';
import { TorrentGateway } from './torrent.gateway';

@Module({
    providers: [TorrentService, TorrentGateway],
    exports: [TorrentService],
})
export class TorrentModule {}
