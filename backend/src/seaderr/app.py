from aiohttp import web
from seaderr.handler.websocket import websocket_handler
from seaderr.singletons import LibtorrentSession


async def libtorrent_ctx(app):
    lt_session = LibtorrentSession()
    await lt_session.init_session()
    app["lt_session"] = await lt_session.get_session()
    yield
    await lt_session.close()


def create_app():
    app = web.Application()
    app.router.add_get("/ws", websocket_handler)
    return app
