import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import MsgPackParser from "socket.io-msgpack-parser";

const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL ?? "ws://localhost:8080";
/* 
// Singleton socket and usage tracking
let globalSocket: Socket | null = null;
let usageCount = 0;

function getSocket(): Socket {
    if (!globalSocket) {
        globalSocket = io(socketUrl, {
            parser: MsgPackParser,
        });
    }
    return globalSocket;
}

function tryDisconnectSocket() {
    if (usageCount <= 0 && globalSocket) {
        globalSocket.disconnect();
        globalSocket = null;
    }
}

export function useSocketConnection() {
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        const socket = getSocket();
        // usageCount++;
        socketRef.current = socket;

        return () => {
            usageCount--;
            if (usageCount <= 0) {
                tryDisconnectSocket();
            }
        };
    }, []);

    return socketRef;
}
*/

export function useSocketConnection() {
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        const socket = io(socketUrl, {
            parser: MsgPackParser,
        });
        socketRef.current = socket;

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, []);

    return socketRef;
}
