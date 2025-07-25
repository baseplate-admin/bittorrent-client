from functools import wraps

from pydantic import BaseModel, ValidationError

from seedarr.singletons import SIO

sio = SIO.get_instance()


def validate_payload(model: type[BaseModel]):
    """
    Decorator to validate a dict payload using the given Pydantic model.
    Assumes the decorated function is async and second argument is the dict payload.
    """

    def decorator(func):
        @wraps(func)
        async def wrapper(sid, data, *args, **kwargs):
            try:
                validated_data = model(**data)
                return await func(sid, validated_data, *args, **kwargs)
            except ValidationError as e:
                print(f"[VALIDATION ERROR] {e}")
                await sio.emit("validation_error", {"errors": e.errors()}, to=sid)
                return None

        return wrapper

    return decorator
