from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List
import pandas as pd
from datetime import datetime

app = FastAPI()

# CORS para permitir Angular
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],  # o tu dominio
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

alerts_storage = []

class Alert(BaseModel):
    id: int
    datetime: datetime
    priority: str
    idvideo: int
    idalertype: int
    iddevice: int
    iduser: int
    message: str
    comment: str = ""

class AlertCreate(BaseModel):
    datetime: datetime
    priority: str
    idvideo: int
    idalertype: int
    iddevice: int
    iduser: int
    message: str
    comment: str = ""

@app.post("/save-alert")
def save_alert(alert: AlertCreate):
    global current_id
    new_alert = Alert(id=current_id, **alert.dict())
    alerts_db.append(new_alert)
    current_id += 1
    return {"message": "Alerta guardada", "alert": new_alert}

@app.get("/reports", response_model=List[Alert])
def get_reports():
    return alerts_db

@app.get("/reports/export")
def export_reports():
    if not alerts_db:
        return {"message": "No hay reportes"}

    df = pd.DataFrame([alert.dict() for alert in alerts_db])
    file_path = "reporte_alertas.xlsx"
    df.to_excel(file_path, index=False)
    return FileResponse(file_path, media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', filename=file_path)
