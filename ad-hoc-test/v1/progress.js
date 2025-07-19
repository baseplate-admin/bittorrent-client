import { io } from 'socket.io-client';

const socket = io('http://localhost:5000');
socket.on('connect', () => {
    console.log('Connected:', socket.id);
});

socket.on('progress', (data) => {
    console.log(
        `${data.infoHash} → ${JSON.stringify(data.prop)}: ${JSON.stringify(
            data.value
        )}`
    );
});
