import logging
from fastapi import APIRouter, HTTPException
from ..models.schemas import PointsRequest
from ..services.osrm_service import route_geometry

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/route")
async def route(req: PointsRequest):
    try:
        result = await route_geometry(req.points)
        return result
    except HTTPException as exc:
        logger.error(f"/route endpoint HTTPException: {exc.detail}")
        raise
    except Exception as exc:
        logger.exception("Unexpected error in /route endpoint")
        raise HTTPException(status_code=500, detail="Internal server error")