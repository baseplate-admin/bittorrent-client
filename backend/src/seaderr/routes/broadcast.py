import asyncio
import libtorrent as lt
from seaderr.singletons import SIO, LibtorrentSession, Logger
import json

sio = SIO.get_instance()
logger = Logger.get_logger()

active_clients: set[str] = set()
poller_started = False


def serialize_alert(alert) -> dict | None:
    match alert:
        case lt.torrent_finished_alert():
            return {"type": "torrent_finished", "message": str(alert)}
        case lt.metadata_received_alert():
            return {"type": "metadata_received", "message": str(alert)}
        case lt.peer_connect_alert():
            return {"type": "peer_connected", "message": str(alert.ip)}
        case lt.state_update_alert():
            statuses = [
                {
                    "name": st.name,
                    "progress": st.progress,
                    "download_rate": st.download_rate,
                    "upload_rate": st.upload_rate,
                    "num_peers": st.num_peers,
                    "state": st.state,
                }
                for st in alert.status
            ]
            return {"type": "state_update", "statuses": statuses}
        case lt.tracker_error_alert():
            return {
                "type": "tracker_error",
                "message": alert.message(),  # CALL the method!
                "url": str(alert.url),
                "error": str(alert.error),
            }

        case lt.add_torrent_alert():
            info_hash = None
            if hasattr(alert.handle, "info_hash"):
                info_hash = str(alert.handle.info_hash())
            return {
                "type": "add_torrent",
                "message": str(alert),
                "info_hash": info_hash,
            }
        case lt.udp_error_alert():
            return {
                "type": "udp_error",
                "message": alert.message(),  # CALL the method!
                "endpoint": str(alert.endpoint),
            }
        case _:
            raise ValueError(f"Unsupported alert type: {type(alert)}")


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
                try:
                    for sid in active_clients:
                        logger.info(
                            f"Broadcasting {len(alerts)} alerts to {len(active_clients)} clients"
                        )
                        await sio.emit("broadcast", data, room=sid)
                except TypeError as e:
                    logger.error(f"JSON serialization failed for alert data: {data}")
                    logger.error(f"Serialization error: {e}")
                    continue

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
