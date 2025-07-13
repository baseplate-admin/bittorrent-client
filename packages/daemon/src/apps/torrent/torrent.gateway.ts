import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { TorrentService } from './torrent.service';

@WebSocketGateway()
export class TorrentGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger(TorrentGateway.name);
  constructor(private readonly torrentService: TorrentService) {}

  afterInit(server: Server) {
    this.logger.log('Initialized!');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('parse_magnet')
  handleParseMagnet(client: Socket, payload: { data: string }) {}

  @SubscribeMessage('magnet')
  async handleMagnetLink(client: Socket, payload: { data: string }) {
    const infoHash = await this.torrentService.startTorrent(payload.data);
    this.server.emit('magnet', infoHash);
  }

  @SubscribeMessage('message')
  handleMessage(
    client: Socket,
    payload: { user: string; message: string },
  ): void {
    this.server.emit('msgToClient', payload);
  }
}
