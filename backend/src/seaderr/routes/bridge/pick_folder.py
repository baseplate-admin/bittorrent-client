import asyncio
from seaderr.singletons import SIO
from cross_platform_folder_picker import open_folder_picker

sio = SIO.get_instance()


@sio.on("pick_folder")  # type: ignore
async def pick_folder(sid: str):
    """
    Handle the 'pick_folder' event from the client.
    """

    try:
        folder_path = await asyncio.to_thread(open_folder_picker)  # Run in thread
        if folder_path:
            return {"status": "success", "path": folder_path}
        else:
            return {"status": "cancelled", "message": "No folder selected"}
    except Exception as e:
        return {"status": "error", "message": str(e)}
