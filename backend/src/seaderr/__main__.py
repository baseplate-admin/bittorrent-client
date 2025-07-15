import click
import asyncio
import uvicorn
from seaderr.app import create_app
from seaderr.singletons import Logger
import logging as python_logging


async def run_app(host: str, port: int, debug: bool):
    app = await create_app()
    if debug:
        Logger.set_level(python_logging.DEBUG)

    config = uvicorn.Config(
        app,
        host=host,
        port=port,
        log_config=None,
    )
    server = uvicorn.Server(config)

    await server.serve()


@click.command()
@click.option("--host", default="127.0.0.1", help="Host to listen on")
@click.option("--port", default=8080, type=int, help="Port to listen on")
@click.option("--debug", is_flag=False, type=bool, help="Run in debug mode")
def main(host: str, port: int, debug: bool):
    asyncio.run(run_app(host, port, debug))


if __name__ == "__main__":
    main()
