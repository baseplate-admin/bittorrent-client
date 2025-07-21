import { io, Socket } from "socket.io-client";
import { useEffect, useRef } from "react";
import MsgPackParser from "socket.io-msgpack-parser";

const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL ?? "ws://localhost:8080";

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
