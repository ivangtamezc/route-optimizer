import logging
from fastapi import APIRouter
from ..core.config import get_settings
from ..models.schemas import CompareRequest, CompareResponse

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/compare", response_model=CompareResponse)
async def compare_energy(req: CompareRequest):
    settings = get_settings()
    # Diesel calculations
    diesel_cost = req.distance_km * settings.diesel_consumption * settings.diesel_price
    diesel_co2 = req.distance_km * settings.diesel_consumption * settings.co2_per_liter
    # Electric calculations
    electric_cost = req.distance_km * settings.electric_consumption * settings.electric_price
    electric_co2 = req.distance_km * settings.electric_consumption * settings.electric_co2_factor
    # Savings
    cost_savings = diesel_cost - electric_cost
    co2_reduction = diesel_co2 - electric_co2
    percent_savings = (cost_savings / diesel_cost * 100) if diesel_cost else 0
    trees_equivalent = co2_reduction / settings.tree_absorption
    return CompareResponse(
        diesel_cost=diesel_cost,
        diesel_co2=diesel_co2,
        electric_cost=electric_cost,
        electric_co2=electric_co2,
        cost_savings=cost_savings,
        co2_reduction=co2_reduction,
        percent_savings=percent_savings,
        trees_equivalent=trees_equivalent,
    )