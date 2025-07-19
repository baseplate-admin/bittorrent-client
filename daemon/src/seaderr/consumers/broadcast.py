import asyncio

import libtorrent as lt

from seaderr.datastructures import EventDataclass
from seaderr.enums import SyntheticEvent
from seaderr.managers import BroadcastClientManager
from seaderr.singletons import SIO, EventBus, LibtorrentSession, Logger
from seaderr.utilities import serialize_magnet_torrent_info

event_bus = EventBus.get_bus()
logger = Logger.get_logger()
broadcast_client_manager = BroadcastClientManager()
sio = SIO.get_instance()


async def serialize_alert(alert) -> dict:
    if isinstance(alert, EventDataclass):
        match alert.event:
            case SyntheticEvent.RESUMED:
                return {
                    "type": "synthetic:resumed",
                    "info_hash": str(alert.torrent.info_hash()),
                }

            case SyntheticEvent.PAUSED:
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

            # https://github.com/baseplate-admin/bittorrent-client/issues/7#issuecomment-3090723219
            # case lt.tracker_error_alert():
            #     return {
            #         "type": "libtorrent:tracker_error",
            #         "message": alert.message,
            #         "url": str(alert.url),
            #         "error": str(alert.error),
            #     }

            # https://github.com/baseplate-admin/bittorrent-client/issues/7#issuecomment-3091519096
            # case lt.udp_error_alert():
            #     return {
            #         "type": "libtorrent:udp_error",
            #         "message": alert.message(),
            #         "endpoint": str(alert.endpoint),
            #     }
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
                    try:
                        info_dict = await serialize_magnet_torrent_info(st.handle)
                    except RuntimeError:
                        # If metadata not ready, fallback minimal info
                        info_dict = {
                            "info_hash": str(st.info_hash),
                            "name": st.name,
                            "progress": round(st.progress * 100, 2),
                            "download_rate": st.download_rate,
                            "upload_rate": st.upload_rate,
                            "num_peers": st.num_peers,
                        }

                    # Add the human-readable state string
                    info_dict["state"] = lt_state_map.get(st.state, "unknown")
                    statuses.append(info_dict)

                return {"type": "libtorrent:state_update", "statuses": statuses}

            # case lt.dht_stats_alert():
            #     active_requests = [
            #         {
            #             "type": r["type"],
            #             "outstanding_requests": r["outstanding_requests"],
            #             "timeouts": r["timeouts"],
            #             "responses": r["responses"],
            #             "branch_factor": r["branch_factor"],
            #             "nodes_left": r["nodes_left"],
            #             "last_sent": r["last_sent"],
            #             "first_timeout": r["first_timeout"],
            #         }
            #         for r in alert.active_requests
            #     ]
            #     routing_table = [
            #         {
            #             "num_nodes": bucket["num_nodes"],
            #             "num_replacements": bucket["num_replacements"],
            #         }
            #         for bucket in alert.routing_table
            #     ]
            #     return {
            #         "type": "libtorrent:dht_stats",
            #         "active_requests": active_requests,
            #         "routing_table": routing_table,
            #     }
            # case lt.session_stats_header_alert():
            #     return {
            #         "type": "libtorrent:session_stats_header",
            #         "counters": list(alert.message().split("\t")),
            #    }
            # case lt.session_stats_alert():

            #     return {
            #         "type": "libtorrent:session_stats",
            #         "values": list(alert.values),
            #     }

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
            logger.info(
                f"Broadcasting alert to {broadcast_client_manager.count()} clients"
            )
            await sio.emit("libtorrent:broadcast", data, room=sid)
        except TypeError as e:
            logger.error(f"JSON serialization failed for alert data: {data}")
            logger.error(f"Serialization error: {e}")
