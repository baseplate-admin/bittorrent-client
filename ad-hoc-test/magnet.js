import { io } from 'socket.io-client';

const socket = io('http://localhost:8080');
socket.on('connect', () => {
    console.log('Connected:', socket.id);

    socket.emit(
        'libtorrent:add_magnet',
        {
            magnet_uri:
                'magnet:?xt=urn:btih:3f92992e2fbeb6ebb251304236bf5e0b600a91c3&dn=%5BFLE%5D%20Lycoris%20Recoil%20-%20S01%20REPACK%20%28BD%201080p%20HEVC%20x265%20Opus%29%20%5BDual%20Audio%5D%20%7C%20Season%201&tr=http%3A%2F%2Fnyaa.tracker.wf%3A7777%2Fannounce&tr=udp%3A%2F%2Fopen.stealth.si%3A80%2Fannounce&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337%2Fannounce&tr=udp%3A%2F%2Fexodus.desync.com%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.torrent.eu.org%3A451%2Fannounce',
            action: 'fetch_metadata',
        },
        (response) => {
            console.log('Received acknowledgment from server:', response);
            process.exit(0);
        }
    );
});
