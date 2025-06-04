from fastapi import FastAPI, HTTPException
from pymongo import MongoClient
from pydantic import BaseModel
import os
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime



load_dotenv()  # Carga variables de entorno

app = FastAPI()

# Configuración de CORS
origins = [
    "http://localhost:4200",  # Angular en desarrollo
    "http://127.0.0.1:4200",  # Alternativa localhost
    #"https://tu-dominio.com",  # Producción
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],
    allow_credentials=True,
    allow_methods=["*"],  # Se puede especificar ["GET", "POST", etc]
    allow_headers=["*"],
)


# Conexión segura usando variables de entorno
client = MongoClient(os.getenv("MONGODB_ATLAS_URI"))
db = client["mi_db"]

# Modelo Pydantic para validación
class User(BaseModel):
    name: str
    user: str
    password: str

#AQUI VAN LOS REQUESTS PARA FASTAPI
@app.post("/users/")
def create_user(user_data: User):
    try:
        result = db["users"].insert_one(user_data.dict())
        return {"id": str(result.inserted_id)}
    except Exception as e:
        raise HTTPException(status_code=400, detail= str(e))

@app.get("/users/")
def get_users():
    users = list(db["users"].find())
    #Convertir ObjectId a string para JSON
    for u in users:
        u["_id"] = str(u["_id"])
    return {"users": users}

# Simulación de datos de alertas
alerts_db = [
    {"id": 1, "title": "Movimiento sospechoso", "fecha": "2025-05-04"},
    {"id": 2, "title": "Alerta de intrusión", "fecha": "2025-05-03"},
]

# Modelo de alerta para recibir desde Angular
class Alert(BaseModel):
    title: str
    fecha: datetime

# GET /alerts
@app.get("/alerts")
def get_alerts():
    return alerts_db

# POST /save-alert
@app.post("/save-alert")
def save_alert(alert: Alert):
    new_alert = {
        "id": len(alerts_db) + 1,
        "title": alert.title,
        "fecha": alert.fecha
    }
    alerts_db.append(new_alert)
    return {"message": "Alerta guardada correctamente", "alert": new_alert}



