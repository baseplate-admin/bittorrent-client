import { Module } from '@nestjs/common';
import { TorrentModule } from './apps/torrent/torrent.module';
@Module({
  imports: [TorrentModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
