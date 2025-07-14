from aiohttp import web


async def websocket_handler(request):
    ws = web.WebSocketResponse()
    await ws.prepare(request)

    async for msg in ws:
        if msg.type == web.WSMsgType.TEXT:
            # Echo the received message back
            await ws.send_str(f"Server received: {msg.data}")

            if msg.data == "close":
                await ws.close()
        elif msg.type == web.WSMsgType.ERROR:
            print(f"WebSocket connection closed with exception {ws.exception()}")

    print("WebSocket connection closed")
    return ws
