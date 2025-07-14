import asyncio
from aiohttp import ClientSession, web


async def ws_client():
    async with ClientSession() as session:
        async with session.ws_connect("http://localhost:8080/ws") as ws:
            await ws.send_str("Hello, server!")

            async for msg in ws:
                if msg.type == web.WSMsgType.TEXT:
                    print(f"Client received: {msg.data}")
                    if msg.data == "Server received: close":
                        await ws.close()
                        break
                elif msg.type == web.WSMsgType.CLOSED:
                    break
                elif msg.type == web.WSMsgType.ERROR:
                    break


asyncio.run(ws_client())
