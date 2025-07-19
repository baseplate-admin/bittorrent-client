import { io } from 'socket.io-client';

const socket = io('http://localhost:8080');
socket.on('connect', () => {
    console.log('Connected:', socket.id);

    socket.emit(
        'remove',
        {
            info_hash: 'c37c904c8bc99ef12a674b105748cdb3f6609e04',
            remove_data: true,
        },
        (response) => {
            console.log('Received acknowledgment from server:', response);
            process.exit(0);
        }
    );
});
