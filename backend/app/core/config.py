import os

OSRM_BASE = os.getenv("OSRM_BASE", "https://router.project-osrm.org")
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")
