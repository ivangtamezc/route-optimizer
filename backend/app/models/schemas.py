from pydantic import BaseModel, Field

class PointsRequest(BaseModel):
    points: list[list[float]] = Field(..., description="[[lat,lng], ...]")

class OptimizeTimeRequest(BaseModel):
    origin: list[float] = Field(..., description="[lat,lng]")
    stops: list[list[float]] = Field(default_factory=list, description="[[lat,lng], ...]")
    return_to_origin: bool = False
    time_limit_s: int = 3

class OptimizeTimeResponse(BaseModel):
    order: list[int]
    ordered_points: list[list[float]]
    total_duration_s: float | None = None
