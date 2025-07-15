import asyncio
import libtorrent as lt
from seaderr.singletons import SIO, LibtorrentSession

sio = SIO.get_instance()


client_tasks = {}


def serialize_alert(alert) -> dict | None:
    if isinstance(alert, lt.torrent_finished_alert):
        return {"type": "torrent_finished", "message": str(alert)}
    elif isinstance(alert, lt.metadata_received_alert):
        return {"type": "metadata_received", "message": str(alert)}
    elif isinstance(alert, lt.peer_connect_alert):
        return {"type": "peer_connected", "message": str(alert.ip)}
    elif isinstance(alert, lt.state_update_alert):
        statuses = []
        for st in alert.status:
            statuses.append(
                {
                    "name": st.name,
                    "progress": st.progress,
                    "download_rate": st.download_rate,
                    "upload_rate": st.upload_rate,
                    "num_peers": st.num_peers,
                    "state": st.state,
                }
            )
        return {"type": "state_update", "statuses": statuses}
    else:
        return None


async def send_alerts_to_client(sid: str):
    lt_ses = await LibtorrentSession.get_session()
    try:
        while True:
            alerts = lt_ses.pop_alerts()
            for alert in alerts:
                data = serialize_alert(alert)
                if data:
                    await sio.emit("broadcast", data, room=sid)
            await asyncio.sleep(1)
    except asyncio.CancelledError:
        print(f"Alert sending task for client {sid} cancelled")
        raise


@sio.on("broadcast")  # type: ignore
async def start_alerts(sid: str, data: dict):
    event = data.get("event", None)
    if not event:
        return {"status": "error", "message": "No event specified"}

    if event == "start":
        if sid in client_tasks:
            return

        task = sio.start_background_task(send_alerts_to_client, sid)
        client_tasks[sid] = task
        return {
            "status": "success",
            "message": f"Started alert stream for client {sid}",
        }

    elif event == "stop":
        task = client_tasks.pop(sid, None)
        if task:
            task.cancel()
            print(f"Stopped alert stream for client {sid}")
            return {
                "status": "success",
                "message": f"Stopped alert stream for client {sid}",
            }

        return {
            "status": "error",
            "message": f"No active alert stream for client {sid}",
        }
