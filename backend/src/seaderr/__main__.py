import click
from seaderr.app import create_app
import uvicorn


@click.command()
@click.option("--host", default="127.0.0.1", help="Host to listen on")
@click.option("--port", default=8080, type=int, help="Port to listen on")
def main(host: str, port: int):
    app = create_app()
    uvicorn.run(app, host=host, port=port)


if __name__ == "__main__":
    main()
