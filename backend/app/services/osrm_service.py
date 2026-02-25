import logging
import httpx
from fastapi import HTTPException
from ..core.config import OSRM_BASE

logger = logging.getLogger(__name__)


def _coords(points_latlng):
    # Convert list of [lat, lng] pairs into OSRM-formatted "lng,lat;lng,lat;..."
    return ";".join([f"{lng},{lat}" for lat, lng in points_latlng])


async def table_durations(points_latlng):
    url = f"{OSRM_BASE}/table/v1/driving/{_coords(points_latlng)}"
    params = {"annotations": "duration"}
    logger.info(f"OSRM table request: url={url}, params={params}")

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url, params=params)
    except httpx.RequestError as exc:
        logger.error(f"OSRM table request error: {exc}")
        raise HTTPException(status_code=502, detail="OSRM table request failed")

    if response.status_code != 200:
        logger.error(f"OSRM table returned status {response.status_code}, body={response.text}")
        raise HTTPException(status_code=502, detail="OSRM table failed")

    try:
        data = response.json()
    except ValueError as exc:
        logger.error(f"OSRM table JSON decode error: {exc}")
        raise HTTPException(status_code=502, detail="Invalid OSRM table response")

    if "durations" not in data:
        logger.error("OSRM durations missing in table response")
        raise HTTPException(status_code=502, detail="OSRM durations missing")

    logger.debug(f"OSRM table response durations: {data['durations']}")
    return data["durations"]


async def route_geometry(points_latlng):
    url = f"{OSRM_BASE}/route/v1/driving/{_coords(points_latlng)}"
    params = {"overview": "full", "geometries": "geojson", "steps": "false"}
    logger.info(f"OSRM route request: url={url}, params={params}")

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url, params=params)
    except httpx.RequestError as exc:
        logger.error(f"OSRM route request error: {exc}")
        raise HTTPException(status_code=502, detail="OSRM route request failed")

    if response.status_code != 200:
        logger.error(f"OSRM route returned status {response.status_code}, body={response.text}")
        raise HTTPException(status_code=502, detail="OSRM route failed")

    try:
        data = response.json()
    except ValueError as exc:
        logger.error(f"OSRM route JSON decode error: {exc}")
        raise HTTPException(status_code=502, detail="Invalid OSRM route response")

    if "routes" not in data or not data["routes"]:
        logger.error("OSRM routes missing or empty in route response")
        raise HTTPException(status_code=502, detail="OSRM routes missing")

    route0 = data["routes"][0]
    result = {
        "distance_m": route0.get("distance"),
        "duration_s": route0.get("duration"),
        "geometry": route0.get("geometry"),
    }
    logger.debug(f"OSRM route response parsed: {result}")
    return result