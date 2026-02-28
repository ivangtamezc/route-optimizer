import os

OSRM_BASE = os.getenv("OSRM_BASE", "https://router.project-osrm.org")
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")

from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    diesel_consumption: float = 0.35
    diesel_price: float = 24.50
    electric_consumption: float = 1.2
    electric_price: float = 2.80
    electric_co2_factor: float = 0.385
    co2_per_liter: float = 2.68
    tree_absorption: float = 21

@lru_cache()
def get_settings() -> Settings:
    return Settings()