import asyncio
import libtorrent as lt
from seaderr.singletons import SIO, LibtorrentSession

sio = SIO.get_instance()

active_clients: set[str] = set()
poller_started = False


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


async def shared_poll_and_broadcast():
    lt_ses = await LibtorrentSession.get_session()
    while True:
        if not active_clients:
            await asyncio.sleep(1)
            continue

        alerts = lt_ses.pop_alerts()
        for alert in alerts:
            data = serialize_alert(alert)
            if data:
                for sid in active_clients:
                    await sio.emit("broadcast", data, room=sid)
        await asyncio.sleep(1)


@sio.on("broadcast")  # type: ignore
async def handle_broadcast_request(sid: str, data: dict):
    global poller_started

    event = data.get("event")
    if not event:
        return {"status": "error", "message": "No event specified"}

    if event == "start":
        active_clients.add(sid)

        if not poller_started:
            sio.start_background_task(shared_poll_and_broadcast)
            poller_started = True

        return {
            "status": "success",
            "message": f"Started alert stream for client {sid}",
        }

    elif event == "stop":
        if sid in active_clients:
            active_clients.remove(sid)
            return {
                "status": "success",
                "message": f"Stopped alert stream for client {sid}",
            }

        return {
            "status": "error",
            "message": f"No active alert stream for client {sid}",
        }
