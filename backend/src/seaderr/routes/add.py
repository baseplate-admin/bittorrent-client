from seaderr.singletons import SIO

sio = SIO.get_instance()


@sio.on("add")  # type: ignore
async def add(sid, data):
    """
    Handle the 'add' event from the client.

    Args:
        data (dict): The data sent from the client.
    """
    print(f"Received add request with data: {data}")
    # Here you would typically process the data and respond back to the client
    await sio.emit("add_response", {"status": "success", "data": data})
