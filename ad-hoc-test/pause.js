import { io } from 'socket.io-client';

const socket = io('http://localhost:8080');
socket.on('connect', () => {
    console.log('Connected:', socket.id);

    socket.emit(
        'pause',
        {
            info_hash: '408fa933bc65b590755a07f700b8ababe7da8ec1',
        },
        (response) => {
            console.log('Received acknowledgment from server:', response);
            process.exit(0);
        }
    );
});
