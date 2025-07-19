import { io } from 'socket.io-client';

const socket = io('http://localhost:8080'); // adjust URL

socket.on('connect', () => {

    socket.emit('broadcast', { event: 'start' }, (response) => {
        console.log('Received acknowledgment from server:', response);
    });
});

socket.on('broadcast', (data) => {
    console.log('Broadcast message received:', data);
});
