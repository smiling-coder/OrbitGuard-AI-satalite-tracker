"""OrbitGuard AI backend. Run from this folder: uvicorn main:app --reload"""
import io, sqlite3
import numpy as np, pandas as pd
from fastapi import FastAPI, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

MU, RE = 398600.4418, 6371.0
app = FastAPI(title="OrbitGuard AI")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
db = sqlite3.connect("orbitguard.db", check_same_thread=False)
db.execute("create table if not exists reports(id integer primary key, created text default current_timestamp, note text)")

class Obj(BaseModel):
    id: str
    alt_km: float = Field(ge=150, le=40000)
    inc_deg: float = Field(ge=0, le=180)
    raan_deg: float = Field(ge=0, le=360)
    ma_deg: float = Field(ge=0, le=360)

def positions(o: Obj, t: np.ndarray) -> np.ndarray:
    """Circular two-body position in an inertial frame (km)."""
    a = RE + o.alt_km
    u = np.radians(o.ma_deg) + np.sqrt(MU / a**3) * t
    i, O = np.radians(o.inc_deg), np.radians(o.raan_deg)
    return a * np.stack([np.cos(O)*np.cos(u) - np.sin(O)*np.cos(i)*np.sin(u),
                         np.sin(O)*np.cos(u) + np.cos(O)*np.cos(i)*np.sin(u),
                         np.sin(i)*np.sin(u)], axis=1)

class ScreenReq(BaseModel):
    primary: Obj
    others: list[Obj]
    hours: float = Field(24, gt=0, le=168)
    step_s: float = Field(20, gt=0, le=120)

@app.get("/api/health")
def health(): return {"status": "ok"}

@app.post("/api/screen")
def screen(r: ScreenReq):
    t = np.arange(0, r.hours * 3600, r.step_s)
    p = positions(r.primary, t)
    out = []
    for o in r.others:
        d = np.linalg.norm(p - positions(o, t), axis=1)
        k = int(d.argmin())
        out.append({"id": o.id, "miss_km": float(d[k]), "tca_s": float(t[k])})
    out.sort(key=lambda x: x["miss_km"])
    return {"label": "SCREENING ESTIMATE (not a collision probability)", "results": out[:50]}

REQ = {"id", "type", "alt_km", "inc_deg", "raan_deg", "ma_deg"}
@app.post("/api/validate")
async def validate(file: UploadFile):
    try: df = pd.read_csv(io.BytesIO(await file.read()))
    except Exception as e: raise HTTPException(400, f"Unreadable CSV: {e}")
    df.columns = [c.strip().lower() for c in df.columns]
    if REQ - set(df.columns): raise HTTPException(400, f"Missing columns: {sorted(REQ - set(df.columns))}")
    errs = []
    if df["id"].duplicated().any(): errs.append("Duplicate ids: " + ", ".join(df.id[df.id.duplicated()].astype(str)))
    for c in REQ - {"id", "type"}:
        bad = pd.to_numeric(df[c], errors="coerce").isna()
        if bad.any(): errs.append(f"Non-numeric {c} in rows {list(df.index[bad] + 2)}")
    return {"rows": len(df), "errors": errs, "valid": not errs}
