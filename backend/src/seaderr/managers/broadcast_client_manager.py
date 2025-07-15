from typing import Set


class BroadcastClientManager:
    _instance: "BroadcastClientManager | None" = None
    _clients: Set[str]

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._clients = set()
        return cls._instance

    def add_client(self, client_id: str) -> None:
        self._clients.add(client_id)

    def remove_client(self, client_id: str) -> None:
        self._clients.discard(client_id)

    def count(self) -> int:
        return len(self._clients)

    def clear(self) -> None:
        self._clients.clear()

    def get_clients(self) -> Set[str]:
        return self._clients

    def __repr__(self):
        return f"<BroadcastClientManager clients={self.count()}>"
