import tempfile

from pydantic import BaseModel, Field


class Model(BaseModel):
    temp: str = Field(default_factory=tempfile.gettempdir)


print(Model.temp)
