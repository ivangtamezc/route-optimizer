# Route Optimizer Frontend

React/Leaflet application for visualizing and interacting with routes optimized by the backend.

## Development

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file in the frontend root with:

   ```
   VITE_API_BASE=http://localhost:8000
   ```

   - `VITE_API_BASE` sets the base URL for the backend API (defaults to `http://localhost:8000`).

3. Start the development server:

   ```bash
   npm run dev
   ```

## Production

Build the production bundle:

```bash
npm run build
```

Serve the `dist/` folder with your favorite static server.