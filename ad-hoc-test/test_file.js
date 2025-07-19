import { io } from 'socket.io-client';
import fs from 'fs';

const socket = io('http://localhost:8080');

socket.on('connect', () => {
    console.log('Connected:', socket.id);
    const torrentBuffer = fs.readFileSync('./file.torrent'); // Buffer of the file
    socket.emit('add_file', { file: torrentBuffer }, (response) => {
        console.log('Received acknowledgment from server:', response);
    }); // Send the buffer
});
