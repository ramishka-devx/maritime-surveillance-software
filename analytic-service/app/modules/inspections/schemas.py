from enum import Enum
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class RestrictedAreaType(str, Enum):
    coral = "coral"
    military = "military"
    restricted = "restricted"


class RestrictedAreaCreateRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str = Field(min_length=1)
    type: RestrictedAreaType
    coordinates: list[list[list[float]]]

    @field_validator("coordinates")
    @classmethod
    def validate_polygon_structure(
        cls, coordinates: list[list[list[float]]]
    ) -> list[list[list[float]]]:
        if len(coordinates) != 1:
            raise ValueError("coordinates must contain exactly one polygon ring")

        ring = coordinates[0]
        if len(ring) < 4:
            raise ValueError("polygon ring must include at least 4 points")

        for point in ring:
            if len(point) != 2:
                raise ValueError("each point must be [lon, lat]")

            lon, lat = point
            if not -180 <= lon <= 180:
                raise ValueError("longitude must be between -180 and 180")
            if not -90 <= lat <= 90:
                raise ValueError("latitude must be between -90 and 90")

        if ring[0] != ring[-1]:
            raise ValueError("polygon ring must be closed")

        return coordinates

    @model_validator(mode="after")
    def ensure_not_blank_name(self) -> "RestrictedAreaCreateRequest":
        if not self.name.strip():
            raise ValueError("name must not be empty")
        return self


class RestrictedAreaCreateResponse(BaseModel):
    id: int
    name: str
    type: RestrictedAreaType
    geometry: dict


class RestrictedAreaShipDetectionsResponse(BaseModel):
    columns: list[str]
    rows: list[list[Any]]
    count: int
    page: int
    limit: int
    total_items: int
    total_pages: int
