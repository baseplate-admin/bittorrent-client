import logging as python_logging
import multiprocessing
import traceback

import anyio
import click
import uvicorn

from seaderr.app import create_app
from seaderr.singletons import Logger


async def run_app(host: str, port: int, debug: bool):
    app = await create_app()
    if debug:
        Logger.set_level(python_logging.DEBUG)

    try:
        config = uvicorn.Config(
            app,
            host=host,
            port=port,
            log_config=None,
            workers=multiprocessing.cpu_count(),
        )
        server = uvicorn.Server(config)

        await server.serve()
    except Exception as e:
        traceback.print_exception(e)


@click.command()
@click.option("--host", default="127.0.0.1", help="Host to listen on")
@click.option("--port", default=8080, type=int, help="Port to listen on")
@click.option("--debug", is_flag=True, type=bool, help="Run in debug mode")
def main(host: str, port: int, debug: bool):
    anyio.run(run_app, host, port, debug)


if __name__ == "__main__":
    main()
