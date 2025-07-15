import click
import asyncio
import uvicorn
from seaderr.app import create_app


async def run_app(host: str, port: int):
    app = await create_app()

    config = uvicorn.Config(app, host=host, port=port)
    server = uvicorn.Server(config)
    await server.serve()


@click.command()
@click.option("--host", default="127.0.0.1", help="Host to listen on")
@click.option("--port", default=8080, type=int, help="Port to listen on")
def main(host: str, port: int):
    asyncio.run(run_app(host, port))


if __name__ == "__main__":
    main()
