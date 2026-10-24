# Architecture
- `frontend/js/app.js`: one ES module. Sections: orbit maths (circular two-body, inertial frame), Three.js scene, screening, pages (tracker, risk, manoeuvre, collision, density, trajectory, detection, alerts, drag, reports, settings).
- `backend/main.py`: FastAPI with `/api/health`, `/api/screen` (NumPy), `/api/validate` (Pandas), SQLite for report metadata.
- Data labels: SIMULATION (generated), IMPORTED (user file, unverified), SYNTHETIC (collision fragments), PREDICTION, UNCERTAIN.
- Limits: circular orbits only, no SGP4, no covariance, so no collision probabilities are produced.
