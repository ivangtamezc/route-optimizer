# Route Optimizer

Full-stack route optimization application using FastAPI, OSRM, and React/Leaflet.

## Architecture

- **Backend**: FastAPI with endpoints for `/route`, `/table`, `/optimize_time`.
- **Services**: `osrm_service.py` for OSRM calls; `tsp_solver.py` for route optimization logic.
- **Frontend**: React (Vite) application with Leaflet for map interactions.

## Configuration

Environment variables (load from `.env` or your shell):

- `OSRM_BASE` (default: `https://router.project-osrm.org`): Base URL for OSRM server.
- `ALLOWED_ORIGINS` (default: `http://localhost:5173`): Comma-separated list of CORS origins.

## Running Locally

1. Install backend dependencies:
   ```bash
   pip install -r backend/requirements.txt
   ```
2. Install frontend dependencies and start dev server:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
3. Start backend server:
   ```bash
   uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
   ```

## OSRM Local Setup

To run an OSRM server locally instead of the public endpoint:

### Prerequisites

- Install [OSRM Backend](https://github.com/Project-OSRM/osrm-backend) tools (e.g., via Homebrew or APT).
- Download a map extract (e.g., `.osm.pbf`) in `osrm/data/` (e.g., `nuevo-leon-latest.osm.pbf`).

### Preprocessing

```bash
osrm-extract -p /path/to/osrm-backend/proprofiles/car.lua osrm/data/nuevo-leon-latest.osm.pbf
osrm-partition osrm/data/nuevo-leon-latest.osm.pbf.osrm
osrm-customize osrm/data/nuevo-leon-latest.osm.pbf.osrm
```

### Running the Server

```bash
osrm-routed --algorithm mld osrm/data/nuevo-leon-latest.osm.pbf.osrm
```

By default this listens on `http://0.0.0.0:5000`. To use locally, set:

```bash
export OSRM_BASE=http://localhost:5000
```

Alternatively, using Docker:

```bash
docker run -t -v $(pwd)/osrm/data:/data osrm/osrm-backend osrm-extract -p /opt/car.lua /data/nuevo-leon-latest.osm.pbf
docker run -d -p 5000:5000 -v $(pwd)/osrm/data:/data osrm/osrm-backend osrm-routed --algorithm mld /data/nuevo-leon-latest.osm.pbf
```

Ensure `OSRM_BASE` points to your local server URL (e.g., `http://localhost:5000`).