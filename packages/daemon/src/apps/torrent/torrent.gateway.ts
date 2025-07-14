import {
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Inject, forwardRef } from '@nestjs/common';
import { TorrentService } from './torrent.service';

@WebSocketGateway({ cors: true })
export class TorrentGateway
    implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
    @WebSocketServer() server: Server;
    private logger: Logger = new Logger(TorrentGateway.name);
    constructor(
        @Inject(forwardRef(() => TorrentService))
        private readonly torrentService: TorrentService,
    ) {}
    afterInit() {
        this.logger.log('Initialized!');
    }

    handleConnection(client: Socket) {
        this.logger.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);
    }
    broadcastUpdate(infoHash: string, prop: string | symbol, value: any) {
        this.server.emit('progress', {
            infoHash,
            prop,
            value: JSON.stringify(value),
        });
    }

    @SubscribeMessage('get_all')
    async handleGetAllTorrents(client: Socket) {
        const torrents = await this.torrentService.getProcesses();
        client.emit('get_all', torrents);
    }

    @SubscribeMessage('remove')
    async handleRemoveTorrent(client: Socket, payload: { infoHash: string }) {
        await this.torrentService.removeTorrent(payload.infoHash);
        client.emit('remove', {
            message: 'Removed Torrent',
            infoHash: payload.infoHash,
        });
    }

    @SubscribeMessage('pause')
    async handlePauseTorrent(client: Socket, payload: { infoHash: string }) {
        await this.torrentService.pauseTorrent(payload.infoHash);
        client.emit('pause', {
            message: 'Paused Torrent',
            infoHash: payload.infoHash,
        });
    }

    @SubscribeMessage('resume')
    async handleResumeTorrent(client: Socket, payload: { infoHash: string }) {
        await this.torrentService.resumeTorrent(payload.infoHash);
        client.emit('resume', {
            message: 'Resumed Torrent',
            infoHash: payload.infoHash,
        });
    }

    @SubscribeMessage('add')
    async handleMagnetLink(client: Socket, payload: { data: string | Buffer }) {
        try {
            const infoHash = await this.torrentService.startTorrent(
                payload.data,
            );
            client.emit('add', infoHash);
        } catch (error) {
            console.error('Error adding torrent:', error);
            client.emit('error', { message: error.message });
        }
    }

    @SubscribeMessage('message')
    handleMessage(
        client: Socket,
        payload: { user: string; message: string },
    ): void {
        client.emit('msgToClient', payload);
    }
}
