import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
import numpy as np
from fastapi.testclient import TestClient
from main import app, positions, Obj, RE

c = TestClient(app)
O = {"id": "x", "alt_km": 500, "inc_deg": 51, "raan_deg": 10, "ma_deg": 0}

def test_health(): assert c.get("/api/health").json() == {"status": "ok"}

def test_constant_radius():
    p = positions(Obj(**O), np.arange(0, 6000, 60.0))
    assert np.allclose(np.linalg.norm(p, axis=1), RE + 500)

def test_identical_orbits_zero_miss():
    r = c.post("/api/screen", json={"primary": O, "others": [{**O, "id": "y"}], "hours": 1}).json()
    assert r["results"][0]["miss_km"] < 1e-6

def test_validate_rejects_missing_columns():
    r = c.post("/api/validate", files={"file": ("a.csv", "id,type\n1,satellite", "text/csv")})
    assert r.status_code == 400
