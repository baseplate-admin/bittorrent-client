# logger_singleton.py

import logging
from typing import Optional
from colorama import init as colorama_init, Fore, Style


class ColorFormatter(logging.Formatter):
    COLORS = {
        "DEBUG": Fore.BLUE,
        "INFO": Fore.GREEN,
        "WARNING": Fore.YELLOW,
        "ERROR": Fore.RED,
        "CRITICAL": Fore.MAGENTA + Style.BRIGHT,
    }

    def format(self, record):
        color = self.COLORS.get(record.levelname, "")
        record.levelname = f"{color}{record.levelname}{Style.RESET_ALL}"
        return super().format(record)


class Logger:
    _instance: Optional[logging.Logger] = None
    _log_level: int = logging.INFO

    @classmethod
    def set_level(cls, level: int) -> None:
        cls._log_level = level

    @classmethod
    def init(cls, name: str = "seaderr") -> None:
        """
        Initializes the logger singleton with colorful output.
        Safe to call multiple times.
        """
        if cls._instance:
            return

        colorama_init(autoreset=True)

        logger = logging.getLogger(name)
        logger.setLevel(cls._log_level)

        formatter = ColorFormatter(
            "[%(asctime)s] [%(levelname)s] [%(name)s] %(message)s", "%Y-%m-%d %H:%M:%S"
        )

        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.DEBUG)
        console_handler.setFormatter(formatter)

        logger.handlers = []
        logger.addHandler(console_handler)
        logger.propagate = False

        for target in [
            "uvicorn",
            "uvicorn.error",
            "uvicorn.access",
            "socketio",
            "engineio",
        ]:
            t_logger = logging.getLogger(target)
            t_logger.setLevel(logging.DEBUG)
            t_logger.handlers = [console_handler]
            t_logger.propagate = False

        cls._instance = logger

    @classmethod
    def get_logger(cls) -> logging.Logger:
        if not cls._instance:
            raise RuntimeError("Logger session is not initialized.")
        return cls._instance
