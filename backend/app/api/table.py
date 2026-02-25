import logging
from fastapi import APIRouter, HTTPException
from ..models.schemas import PointsRequest
from ..services.osrm_service import table_durations

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/table")
async def table(req: PointsRequest):
    try:
        durations = await table_durations(req.points)
        return {"durations": durations}
    except HTTPException as exc:
        logger.error(f"/table endpoint HTTPException: {exc.detail}")
        raise
    except Exception as exc:
        logger.exception("Unexpected error in /table endpoint")
        raise HTTPException(status_code=500, detail="Internal server error")