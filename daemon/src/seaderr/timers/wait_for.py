import anyio
import time
from typing import Awaitable, Callable, Literal, Optional


async def wait_for[T](
    check: Callable[[], Awaitable[Optional[T]]],
    *,
    timeout: float = 30.0,
    base_delay: float = 0.1,
    max_delay: float = 5.0,
    backoff: Literal["exponential", "fibonacci"] = "exponential",
) -> T:
    """
    Waits for an async `check()` function to return a truthy value using backoff polling

    Args:
        check: An async function returning a truthy value if the resource is ready.
        timeout: Max time to wait before raising TimeoutError.
        base_delay: Initial delay in seconds between retries.
        max_delay: Maximum delay cap.
        backoff: "exponential" or "fibonacci" backoff strategy.

    Returns:
        The truthy value returned by `check`.

    Raises:
        TimeoutError: If timeout is reached before `check()` returns truthy.
    """
    start = time.monotonic()

    delay = base_delay
    fib_a, fib_b = base_delay, base_delay

    while True:
        result = await check()
        if result:
            return result

        elapsed = time.monotonic() - start
        if elapsed > timeout:
            raise TimeoutError("Timed out waiting for resource.")

        await anyio.sleep(delay)

        match backoff:
            case "exponential":
                delay = min(delay * 2, max_delay)
            case "fibonacci":
                fib_a, fib_b = fib_b, min(fib_a + fib_b, max_delay)
                delay = fib_a
            case _:
                raise ValueError(
                    "Invalid backoff strategy: choose 'exponential' or 'fibonacci'"
                )
