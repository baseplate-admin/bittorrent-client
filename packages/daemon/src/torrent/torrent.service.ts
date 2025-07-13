import { Injectable } from '@nestjs/common';

@Injectable()
export class TorrentService {
  getHello(): string {
    return 'Hello fuck World!';
  }
}
