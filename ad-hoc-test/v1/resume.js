import { io } from 'socket.io-client';

const socket = io('http://localhost:5000');
socket.on('connect', () => {
    console.log('Connected:', socket.id);

    socket.emit('resume', {
        infoHash: '408fa933bc65b590755a07f700b8ababe7da8ec1',
    });
});

socket.on('resume', (data) => {
    console.log('Message from server:', data);
    process.exit(0);
});
