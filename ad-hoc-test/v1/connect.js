import { io } from 'socket.io-client';

const SERVER_URL = 'http://localhost:8080';
const TOTAL_CLIENTS = 10000;

async function createClient(id) {
    return new Promise((resolve) => {
        const socket = io(SERVER_URL, {
            reconnection: false,
            timeout: 5000,
        });

        socket.on('connect', () => {
            console.log(`Client #${id} connected`);

            // Send a message after connecting
            socket.emit('message', `Hello from client #${id}`);

            // Optionally listen for the echo message from the server
            socket.on('message', (data) => {
                // console.log(`Client #${id} received: ${data}`);
                // Disconnect after receiving message
                socket.disconnect();
                resolve();
            });
        });

        socket.on('connect_error', (err) => {
            console.error(`Client #${id} failed to connect`, err.message);
            resolve();
        });

        socket.on('disconnect', () => {
            console.log(`Client #${id} disconnected`);
        });
    });
}

async function main() {
    const batchSize = 1000; // create clients in batches to avoid resource spikes
    for (let i = 0; i < TOTAL_CLIENTS; i += batchSize) {
        const batchPromises = [];
        for (let j = i; j < i + batchSize && j < TOTAL_CLIENTS; j++) {
            batchPromises.push(createClient(j));
        }
        await Promise.all(batchPromises);
        console.log(`Batch ${i / batchSize + 1} completed`);
    }

    console.log('All clients finished.');
}

main().catch(console.error);
