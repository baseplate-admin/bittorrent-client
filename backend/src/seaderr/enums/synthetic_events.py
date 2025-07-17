from enum import Enum, auto


class SyntheticEvent(Enum):
    """
    Enum representing synthetic events that can be triggered by the system.
    These events are used to simulate user interactions or system states.
    """

    RESUMED = auto()
    PAUSED = auto()
    REMOVED = auto()
