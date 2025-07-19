import { io } from 'socket.io-client';

const socket = io('http://localhost:5000');
socket.on('connect', () => {
    console.log('Connected:', socket.id);

    socket.emit('remove', {
        infoHash: 'ebf2058b52a2faa9cc6ba774de07f134e96a8eca',
    });
});

socket.on('remove', (data) => {
    console.log('Message from server:', data);
    process.exit(0);
});
