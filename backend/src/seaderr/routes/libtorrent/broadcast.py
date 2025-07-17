import asyncio

import libtorrent as lt
from seaderr.datastructures import EventDataclass
from seaderr.enums import SyntheticEvent
from seaderr.managers import BroadcastClientManager
from seaderr.singletons import (
    SIO,
    EventBus,
    LibtorrentSession,
    Logger,
)

sio = SIO.get_instance()
logger = Logger.get_logger()
broadcast_client_manager = BroadcastClientManager()
event_bus = EventBus.get_bus()

poller_started = False


async def serialize_alert(alert) -> dict:
    if isinstance(alert, EventDataclass):
        match alert.event:
            case SyntheticEvent.RESUMED:
                data = {
                    "type": "synthetic:resumed",
                    "info_hash": str(alert.torrent.info_hash()),
                }
                print(data)
                return data

            case SyntheticEvent.PAUSED:
                print(alert)
                return {
                    "type": "synthetic:paused",
                    "info_hash": str(alert.torrent.info_hash()),
                }
            case SyntheticEvent.REMOVED:
                return {
                    "type": "synthetic:removed",
                    "info_hash": str(alert.torrent.info_hash()),
                }
            case _:
                return {
                    "type": "synthetic:unknown",
                    "message": f"Unknown synthetic event: {alert.event}",
                }
    else:
        match alert:
            case lt.torrent_finished_alert():
                return {"type": "libtorrent:torrent_finished", "message": str(alert)}
            case lt.add_torrent_alert():
                info_hash = None
                if hasattr(alert.handle, "info_hash"):
                    info_hash = str(alert.handle.info_hash())
                return {
                    "type": "libtorrent:add_torrent",
                    "message": str(alert),
                    "info_hash": info_hash,
                }
            case lt.peer_connect_alert():
                return {"type": "libtorrent:peer_connected", "message": str(alert.ip)}
            case lt.tracker_error_alert():
                return {
                    "type": "libtorrent:tracker_error",
                    "message": alert.message(),
                    "url": str(alert.url),
                    "error": str(alert.error),
                }
            case lt.udp_error_alert():
                return {
                    "type": "libtorrent:udp_error",
                    "message": alert.message(),
                    "endpoint": str(alert.endpoint),
                }
            case lt.state_update_alert():
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
                for st in alert.status:
                    peers_info = []
                    seeders = 0
                    try:
                        peers = st.handle.get_peer_info()
                        for p in peers:
                            is_seed = bool(p.flags & lt.peer_info.seed)
                            if is_seed:
                                seeders += 1
                            peers_info.append(
                                {
                                    "ip": str(p.ip),
                                    "progress": p.progress,
                                    "total_download": p.total_download,
                                    "total_upload": p.total_upload,
                                    "is_seed": is_seed,
                                }
                            )
                    except Exception:
                        peers_info = []
                        seeders = 0
                    state_str = lt_state_map.get(st.state, "unknown")
                    try:
                        total_size = st.handle.get_torrent_info().total_size()
                    except (RuntimeError, AttributeError):
                        total_size = 0
                    statuses.append(
                        {
                            "info_hash": str(st.info_hash),
                            "name": st.name,
                            "total_size": total_size,
                            "progress": st.progress,
                            "download_rate": st.download_rate,
                            "upload_rate": st.upload_rate,
                            "num_peers": st.num_peers,
                            "seeders": seeders,
                            "state": state_str,
                            "peers": peers_info,
                        }
                    )
                return {"type": "libtorrent:state_update", "statuses": statuses}
            case lt.dht_stats_alert():
                active_requests = [
                    {
                        "type": r["type"],
                        "outstanding_requests": r["outstanding_requests"],
                        "timeouts": r["timeouts"],
                        "responses": r["responses"],
                        "branch_factor": r["branch_factor"],
                        "nodes_left": r["nodes_left"],
                        "last_sent": r["last_sent"],
                        "first_timeout": r["first_timeout"],
                    }
                    for r in alert.active_requests
                ]
                routing_table = [
                    {
                        "num_nodes": bucket["num_nodes"],
                        "num_replacements": bucket["num_replacements"],
                    }
                    for bucket in alert.routing_table
                ]
                return {
                    "type": "libtorrent:dht_stats",
                    "active_requests": active_requests,
                    "routing_table": routing_table,
                }
            case lt.session_stats_header_alert():
                return {
                    "type": "libtorrent:session_stats_header",
                    "counters": list(alert.message().split("\t")),
                }
            case lt.session_stats_alert():
                return {
                    "type": "libtorrent:session_stats",
                    "values": list(alert.values),
                }

            case _:
                try:
                    raise ValueError(f"Unsupported alert type: {type(alert)}")
                except Exception as e:
                    logger.error(e)
                    return {}


async def shared_poll_and_publish(bus: EventBus):
    lt_ses = await LibtorrentSession.get_session()
    while True:
        if broadcast_client_manager.count() == 0:
            await asyncio.sleep(1)
            continue

        lt_ses.post_torrent_updates()
        lt_ses.post_dht_stats()
        lt_ses.post_session_stats()

        alerts = lt_ses.pop_alerts()
        for alert in alerts:
            await bus.publish(alert)

        await asyncio.sleep(0.5)


async def alert_consumer(alert):
    data = await serialize_alert(alert)
    if not data:
        return

    clients = broadcast_client_manager.get_clients()
    if not clients:
        return

    for sid in clients:
        try:
            # logger.info(
            #     f"Broadcasting alert to {broadcast_client_manager.count()} clients"
            # )
            await sio.emit("libtorrent:broadcast", data, room=sid)
        except TypeError as e:
            logger.error(f"JSON serialization failed for alert data: {data}")
            logger.error(f"Serialization error: {e}")


@sio.on("libtorrent:broadcast")  # type: ignore
async def handle_broadcast_request(sid: str, data: dict):
    global poller_started

    event = data.get("event")
    if not event:
        return {"status": "error", "message": "No event specified"}

    if event == "start":
        broadcast_client_manager.add_client(sid)

        if not poller_started:
            event_bus.set_consumer(alert_consumer)
            sio.start_background_task(event_bus.start)
            sio.start_background_task(shared_poll_and_publish, event_bus)
            poller_started = True

        return {
            "status": "success",
            "message": f"Started alert stream for client {sid}",
        }

    elif event == "stop":
        if sid in broadcast_client_manager.get_clients():
            broadcast_client_manager.remove_client(sid)
            return {
                "status": "success",
                "message": f"Stopped alert stream for client {sid}",
            }

        return {
            "status": "error",
            "message": f"No active alert stream for client {sid}",
        }
