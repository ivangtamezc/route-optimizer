import logging
from fastapi import APIRouter, HTTPException
from ..models.schemas import OptimizeTimeRequest
from ..services.osrm_service import table_durations
from ..services.tsp_solver import solve_tsp

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/optimize_time")
async def optimize_time(req: OptimizeTimeRequest):
    try:
        points = [req.origin] + req.stops
        if len(points) == 1:
            return {"order": [0], "ordered_points": points, "total_duration_s": 0}

        durations = await table_durations(points)
        order = solve_tsp(durations, req.return_to_origin, req.time_limit_s)
        ordered_points = [points[i] for i in order]

        total = 0.0
        for a, b in zip(order, order[1:]):
            v = durations[a][b]
            if v is None:
                total = None
                break
            total += v

        return {"order": order, "ordered_points": ordered_points, "total_duration_s": total}
    except HTTPException as exc:
        logger.error(f"/optimize_time endpoint HTTPException: {exc.detail}")
        raise
    except Exception as exc:
        logger.exception("Unexpected error in /optimize_time endpoint")
        raise HTTPException(status_code=500, detail="Internal server error")