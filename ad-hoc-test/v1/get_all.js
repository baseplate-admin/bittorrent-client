import { io } from 'socket.io-client';

const socket = io('http://localhost:5000');
socket.on('connect', () => {
    console.log('Connected:', socket.id);
    socket.emit('get_all');
});

socket.on('get_all', (data) => {
    console.log('Message from server:', JSON.stringify(data, null, 2));
    process.exit(0);
});
