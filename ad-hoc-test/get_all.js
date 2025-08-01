import { io } from 'socket.io-client';

const socket = io('http://localhost:8080');
socket.on('connect', () => {
    console.log('Connected:', socket.id);
    socket.emit('libtorrent:get_all', (response) => {
        console.log('Received acknowledgment from server:', response);
        process.exit(0);
    });
});
