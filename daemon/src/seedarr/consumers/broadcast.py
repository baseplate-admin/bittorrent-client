import anyio
import libtorrent as lt

from seedarr.datastructures import EventDataclass
from seedarr.enums import SyntheticEvent
from seedarr.managers import BroadcastClientManager
from seedarr.singletons import SIO, EventBus, LibtorrentSession, Logger

event_bus = EventBus.get_bus()
logger = Logger.get_logger()
broadcast_client_manager = BroadcastClientManager()
sio = SIO.get_instance()


async def serialize_alert(alert) -> dict:
    if isinstance(alert, EventDataclass):
        if alert.event == SyntheticEvent.RESUMED:
            return {
                "type": "synthetic:resumed",
                "info_hash": str(alert.torrent.info_hash()),
            }

        elif alert.event == SyntheticEvent.PAUSED:
            return {
                "type": "synthetic:paused",
                "info_hash": str(alert.torrent.info_hash()),
            }

        elif alert.event == SyntheticEvent.REMOVED:
            return {
                "type": "synthetic:removed",
                "info_hash": str(alert.torrent.info_hash()),
            }

        else:
            return {
                "type": "synthetic:unknown",
                "message": f"Unknown synthetic event: {alert.event}",
            }

    elif isinstance(alert, lt.torrent_finished_alert):
        return {"type": "libtorrent:torrent_finished", "message": str(alert)}

    elif isinstance(alert, lt.add_torrent_alert):
        info_hash = None
        if hasattr(alert.handle, "info_hash"):
            info_hash = str(alert.handle.info_hash())
        return {
            "type": "libtorrent:add_torrent",
            "message": str(alert),
            "info_hash": info_hash,
        }

    elif isinstance(alert, lt.peer_connect_alert):
        return {"type": "libtorrent:peer_connected", "message": str(alert.ip)}

    elif isinstance(alert, lt.state_update_alert):
        lt_state_map = {
            lt.torrent_status.queued_for_checking: "queued_for_checking",
            lt.torrent_status.checking_files: "checking_files",
            lt.torrent_status.downloading_metadata: "downloading_metadata",
            lt.torrent_status.downloading: "downloading",
            lt.torrent_status.finished: "finished",
            lt.torrent_status.seeding: "seeding",
            lt.torrent_status.allocating: "allocating",
            lt.torrent_status.checking_resume_data: "checking_resume_data",
        }

        statuses = []

        try:
            state_list = (
                alert.status
            )  # May raise AttributeError or Boost.Python.ArgumentError
        except Exception as e:
            logger.error(f"Could not access state_update_alert.status: {e}")
            return {
                "type": "libtorrent:state_update",
                "statuses": [],
                "error": "status_unavailable",
            }

        for st in state_list:
            info_dict = {
                "info_hash": str(getattr(st, "info_hash", "unknown")),
                "name": getattr(st, "name", "unknown"),
                "progress": round(getattr(st, "progress", 0.0) * 100, 2),
                "download_rate": getattr(st, "download_rate", 0),
                "upload_rate": getattr(st, "upload_rate", 0),
                "num_peers": getattr(st, "num_peers", 0),
                "num_seeds": getattr(st, "num_seeds", 0),
                "total_size": getattr(st, "total_wanted", 0),
                "state": lt_state_map.get(st.state, "unknown"),
            }
            statuses.append(info_dict)

        return {"type": "libtorrent:state_update", "statuses": statuses}

    else:
        logger.error(f"Unsupported alert type: {type(alert)}")
        return {}


async def shared_poll_and_publish(bus: EventBus):
    lt_ses = await LibtorrentSession.get_session()
    while True:
        if broadcast_client_manager.count() == 0:
            await anyio.sleep(1)
            continue

        lt_ses.post_torrent_updates()

        alerts = lt_ses.pop_alerts()
        for alert in alerts:
            await bus.publish(alert)

        await anyio.sleep(0.25)


async def alert_consumer(alert):
    data = await serialize_alert(alert)
    if not data:
        return

    clients = broadcast_client_manager.get_clients()
    if not clients:
        return

    for sid in clients:
        try:
            logger.info(
                f"Broadcasting alert to {broadcast_client_manager.count()} clients"
            )
            await sio.emit("libtorrent:broadcast", data, room=sid)
        except TypeError as e:
            logger.error(f"JSON serialization failed for alert data: {data}")
            logger.error(f"Serialization error: {e}")
