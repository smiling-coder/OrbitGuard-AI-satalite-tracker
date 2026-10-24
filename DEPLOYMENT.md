# Deployment
**Frontend (GitHub Pages):** push this repo, then Settings > Pages > deploy from branch, folder `/frontend` (or copy `frontend/` to the repo root). The site works without the backend.
**Backend (optional, e.g. Render/Railway):** root `backend/`, install `pip install -r requirements.txt`, start `uvicorn main:app --host 0.0.0.0 --port $PORT`. Restrict `allow_origins` in `main.py` to your site URL. SQLite resets on free hosts; use PostgreSQL for persistence.
**Connecting them:** before `js/app.js` loads, add `<script>window.OG_API="https://your-backend-url"</script>` in `index.html`.
**Tests:** `cd backend && pytest`.
