from fastapi import FastAPI, HTTPException, status, Query, Depends, Response
from pymongo import MongoClient
from typing import Optional
import os
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from bson.objectid import ObjectId
from your_module import generate_frames 

from fastapi.responses import StreamingResponse
import cv2

from fastapi.responses import StreamingResponse, FileResponse, HTMLResponse
from datetime import datetime, timedelta

from models import UserCreate, UserUpdate, UserResponse, UserResponse2
from models import DeviceCreate, DeviceUpdate, DeviceResponse
from models import AlertCreate, AlertUpdate, AlertResponse, AlertStatus, AlertPriority, AlertType
from models import VideoCreate, VideoUpdate, VideoResponse


from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from models import Token, TokenData

import logging
import threading
from pathlib import Path
import subprocess
import atexit
from threading import Lock

from ultralytics import YOLO


load_dotenv()  # Carga variables de entorno


app = FastAPI()

# Configuración de CORS
origins = [
    "http://localhost:4200",  # Angular en desarrollo
    "http://127.0.0.1:4200",  # Alternativa localhost
    #"http://127.0.0.1:8000/token",  # 
    "http://127.0.0.1:4200/token"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # Se puede especificar ["GET", "POST", etc]
    allow_headers=["*"],
    expose_headers=["*"]
)


# Conexión segura usando variables de entorno
client = MongoClient(os.getenv("MONGODB_ATLAS_URI"))
db = client["mi_db"]

# Modelo Pydantic para validación
#class User(BaseModel):
#    name: str
#    user: str
#    password: str

# Modelo Pydantic para validación
# Modelos Pydantic


################################### MODELO DETECCION DE OBJETOS ###########################################

# ---- Directorios de trabajo ----

BASE_DIR = Path(__file__).resolve().parent
MODELS_DIR = BASE_DIR / "modelos"
VIDEOS_DIR = BASE_DIR / "videos"
VIDEOS_DIR.mkdir(parents=True, exist_ok=True)
#
YOLO_MODEL_PATH = MODELS_DIR / "my_model.pt"

# Cargar modelo
yolo_model = YOLO(str(YOLO_MODEL_PATH))
yolo_model.fuse()  # Optimiza el modelo para inferencia (opcional pero recomendado)



## ---- Archivos del modelo ----
#PROTO_FILE = MODELS_DIR / "MobileNetSSD_deploy.prototxt"
#CAFFE_MODEL = MODELS_DIR / "MobileNetSSD_deploy.caffemodel"

## ---- Validar existencia de modelos ----
#if not PROTO_FILE.exists() or not CAFFE_MODEL.exists():
#    logging.error("Faltan archivos del modelo en 'modelos/'.")
#    raise FileNotFoundError("Faltan los archivos del modelo.")
#
## ---- Cargar modelos ----
#face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
#net = cv2.dnn.readNetFromCaffe(str(PROTO_FILE), str(CAFFE_MODEL))

# ---- Clases detectables ----
#class_names = [
#    "background", "aeroplane", "bicycle", "bird", "boat", "bottle", "bus",
#    "car", "cat", "chair", "cow", "diningtable", "dog", "horse", "motorbike",
#    "person", "pottedplant", "sheep", "sofa", "train", "tvmonitor"
#
class_names = [
    "Product", "normal", "shoplifting"
]

# ---- Inicializar la cámara ---- ##################################################################3

# Variables globales
camera_active = False
video_capture = None
capture_lock = Lock()
# ---- Inicializar cámara ----
def init_camera():
    global video_capture, camera_active
    with capture_lock:
        if video_capture is None or not video_capture.isOpened():
            video_capture = cv2.VideoCapture(0)
            camera_active = True
            logging.info("Cámara inicializada")

def release_camera():
    global video_capture, camera_active
    with capture_lock:
        if video_capture is not None and video_capture.isOpened():
            video_capture.release()
            camera_active = False
            logging.info("Cámara liberada")


atexit.register(release_camera)

# ---- Funciones de detección ----
#def detect_faces(gray_frame):
#    return face_cascade.detectMultiScale(gray_frame, scaleFactor=1.1, minNeighbors=5)
#
#def detect_objects(frame):
#    blob = cv2.dnn.blobFromImage(cv2.resize(frame, (300, 300)), 0.007843, (300, 300), 127.5)
#    net.setInput(blob)
#    return net.forward()

def detect_objects(frame): ## NUEVO
    results = yolo_model(frame, imgsz=640, conf=0.5, device="cpu") # Ajusta "device" a "cuda" si se usa GPU
    return results[0]  # Retorna el primer resultado (para una sola imagen)


#def draw_face_boxes(frame, faces):
#    for (x, y, w, h) in faces:
#        cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)

#def draw_object_boxes(frame, detections, threshold=0.2):
#    h, w = frame.shape[:2]
#    for i in range(detections.shape[2]):
#        confidence = detections[0, 0, i, 2]
#        if confidence > threshold:
#            class_id = int(detections[0, 0, i, 1])
#            box = detections[0, 0, i, 3:7] * [w, h, w, h]
#            (startX, startY, endX, endY) = box.astype("int")
#            label = f"{class_names[class_id]}: {confidence:.2f}"
#            cv2.rectangle(frame, (startX, startY), (endX, endY), (255, 0, 0), 2)
#            y = max(startY - 10, 10)
#            cv2.putText(frame, label, (startX, y), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)

#def draw_object_boxes(frame, detections, threshold=0.5): ## NUEVO
#    for result in detections.boxes.data.tolist():
#        x1, y1, x2, y2, score, class_id = result
#        if score > threshold:
#            label = f"{yolo_model.names[int(class_id)]}: {score:.2f}"
#            cv2.rectangle(frame, (int(x1), int(y1)), (int(x2), int(y2)), (255, 0, 0), 2)
#            cv2.putText(frame, label, (int(x1), int(y1) - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)

#def draw_object_boxes(frame, detections, threshold=0.2):
#    h, w = frame.shape[:2]
#    #for i in range(detections.shape[2]):
#    for result in detections.boxes.data.tolist():
#        confidence = detections[0, 0, result, 2]
#        if confidence > threshold:
#            class_id = int(detections[0, 0, result, 1])
#            box = detections[0, 0, result, 3:7] * [w, h, w, h]
#            (startX, startY, endX, endY) = box.astype("int")
#            label = f"{class_names[class_id]}: {confidence:.2f}"
#            cv2.rectangle(frame, (startX, startY), (endX, endY), (255, 0, 0), 2)
#            y = max(startY - 10, 10)
#            cv2.putText(frame, label, (startX, y), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)

def draw_object_boxes(frame, detections, threshold=0.5):
    # Itera sobre las detecciones
    for box in detections.boxes:
        x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())  # Coordenadas absolutas
        conf = box.conf.item()  # Confianza
        class_id = int(box.cls.item())  # ID de clase
        
        if conf > threshold:
            label = f"{yolo_model.names[class_id]}: {conf:.2f}"
            # Dibuja el bounding box
            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
            # Etiqueta con fondo para mejor legibilidad
            cv2.putText(frame, label, (x1, y1 - 10), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)



# ---- Generar transmisión ----
def generate_frames():
    init_camera()  # Asegurar que la cámara esté encendida
    while camera_active:  # Solo mientras la cámara esté activa
        with capture_lock:
            if video_capture is None or not video_capture.isOpened():
                break
            ret, frame = video_capture.read()
        
        if not ret:
            logging.warning("No se capturó el frame.")
            continue
        
        try:
            #gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)###############################################################################################################
            #faces = detect_faces(gray) ###############################################################################################################
            detections = detect_objects(frame)

            #draw_face_boxes(frame, faces) ###############################################################################################################
            draw_object_boxes(frame, detections)

            ret, buffer = cv2.imencode('.jpg', frame)
            if not ret:
                continue

            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')
        except Exception as e:
            logging.error(f"Error procesando frame: {e}")


@app.get("/video_feed")
def video_feed():
    return StreamingResponse(generate_frames(), media_type="multipart/x-mixed-replace; boundary=frame")



# ---- Grabar video alerta ----
import cv2
import logging
from datetime import datetime, timedelta
from pathlib import Path

def grabar_video_alerta(path: Path, duracion: int = 10, width: int = 640, height: int = 480):
    """
    Graba un video procesando detecciones sobre cada frame durante un tiempo especificado.

    Args:
        path (Path): Ruta donde se guardará el video.
        duracion (int): Duración del video en segundos.
        width (int): Ancho del video.
        height (int): Alto del video.
    """
    try:
        # Inicializa el objeto VideoWriter
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(str(path), fourcc, 20.0, (width, height))
        if not out.isOpened():
            logging.error("No se pudo inicializar el VideoWriter.")
            return

        logging.info(f"Iniciando grabación de alerta por {duracion} segundos en {path}")
        fin_tiempo = datetime.now() + timedelta(seconds=duracion)

        while datetime.now() < fin_tiempo:
            with capture_lock:
                ret, frame = video_capture.read()
            if not ret:
                logging.warning("No se pudo capturar un frame.")
                continue

            try:
                # Redimensionar si el frame no tiene el tamaño esperado
                if frame.shape[1] != width or frame.shape[0] != height:
                    frame = cv2.resize(frame, (width, height))

                # Procesamiento de detección
                detections = detect_objects(frame)
                draw_object_boxes(frame, detections)

                out.write(frame)  # Graba el frame procesado

            except Exception as e:
                logging.exception("Error durante el procesamiento de un frame: %s", e)

        logging.info(f"Grabación completada. Video guardado como: {path.name}")
    except Exception as e:
        logging.exception(f"Fallo al grabar video de alerta: {e}")
    finally:
        out.release()

# ---- Conversión a MP4 (opcional) ----
def convertir_a_mp4(entrada: Path, salida: Path):
    try:
        subprocess.run([
            "ffmpeg", "-y", "-i", str(entrada),
            "-vcodec", "libx264", "-preset", "fast", "-crf", "22", str(salida)
        ], check=True)
    except subprocess.CalledProcessError as e:
        logging.error(f"FFmpeg error: {e}")
        raise HTTPException(status_code=500, detail="Fallo al convertir video.")

##### Contraseña y login seguro ######################################################################
# Configuración de seguridad
SECRET_KEY = "tu_clave_secreta_super_segura"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Helper functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now() + expires_delta
    else:
        expire = datetime.now() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

#AQUI VAN LOS REQUESTS PARA FASTAPI###################################################################################
# Endpoint para obtener el video en streaming
# ---- Endpoint de streaming ----
@app.get("/", response_class=HTMLResponse)
async def root():
    return """
    <html><head><title>Servidor de Cámara</title></head>
    <body>
        <h1>Servidor funcionando ✅</h1>
        <p><a href="/video">Ver transmisión en vivo</a></p>
    </body></html>
    """

@app.get("/video")
async def video():
    if not camera_active:
        init_camera()
    logging.info("Cliente conectado a /video")
    return StreamingResponse(
        generate_frames(), 
        media_type="multipart/x-mixed-replace; boundary=frame"
    )

@app.post("/camera/start")
async def start_camera():
    init_camera()
    return {"message": "Cámara encendida", "status": camera_active}

@app.post("/camera/stop")
async def stop_camera():
    release_camera()
    return {"message": "Cámara apagada", "status": camera_active}

@app.get("/camera/status")
async def camera_status():
    return camera_active

#@app.get("/grabar-alerta")
#async def grabar_alerta(duracion: int = 10):
#    nombre = f"alerta_{datetime.now().strftime('%Y%m%d_%H%M%S')}.mp4"
#    path = VIDEOS_DIR / nombre
#    grabar_video_alerta(path, duracion)
#    return FileResponse(str(path), media_type='video/mp4', filename=nombre)

@app.post("/start_recording")
async def start_recording():
    nombre = f"grabacion_{datetime.now().strftime('%Y%m%d_%H%M%S')}.mp4"
    path = VIDEOS_DIR / nombre
    thread = threading.Thread(target=grabar_video_alerta, args=(path, 10), daemon=True)
    thread.start()
    return {"message": f"Grabación iniciada: {nombre}"}

  
@app.post("/stop_recording")
async def stop_recording():
    try:
        # Tu lógica aquí
        return {"message": "Grabación detenida"}
    except Exception as e:
        print("Error al detener grabación:", e)
        raise HTTPException(status_code=500, detail=str(e))

@app.on_event("shutdown")
def shutdown_event():
    release_camera()
    logging.info("Liberando recursos de la cámara al cerrar la aplicación")



# Descargar reporte #######################################
@app.get("/descargar-reporte")
def descargar_reporte():
    #nombre_archivo = f'reportes/reporte_{datetime.now().strftime("%Y_%W")}.xlsx'
    nombre_archivo = 'reportes.xlsx'
    if os.path.exists(nombre_archivo):
        return FileResponse(
            nombre_archivo,
            media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            filename="reporte_semanal.xlsx"
        )
    return {"mensaje": "Reporte no disponible aún. 2"}

####### USERS ###############################################################################################

### Crear Usuario (POST)
@app.post("/users/", response_model=UserResponse, status_code=201)
async def create_user(user: UserCreate):
    # Verificar si el email ya existe
    if db.users.find_one({"email": user.email}):
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )
    
    # Validar el rol
    if user.role not in ["admin", "operator"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid role. Must be 'admin' or 'operator'"
        )
    
    # Hashear la contraseña
    hashed_password = get_password_hash(user.password)
    
    user_data = user.model_dump(exclude={"password"})
    user_data.update({
        "password": hashed_password,  #versión hasheada
        "createdAt": datetime.now(),
        "updatedAt": datetime.now()
    })
    
    result = db.users.insert_one(user_data)
    created_user = db.users.find_one({"_id": result.inserted_id})
    
    return {
        "id": str(created_user["_id"]),
        "name": created_user["name"],
        "email": created_user["email"],
        "role": created_user["role"],
        "createdAt": created_user["createdAt"],
        "updatedAt": created_user["updatedAt"]
    }

# Obtener Todos los Usuarios (GET)
@app.get("/users/", response_model=list[UserResponse])
async def get_users():
    users = []
    for user in db.users.find().sort("createdAt", -1):
        users.append({
            "id": str(user["_id"]),
            "name": user["name"],
            "email": user["email"],
            "password": user["password"],
            "role": user["role"],
            "createdAt": str(user["createdAt"]),
            "updatedAt": str(user["updatedAt"])
        })
    return users

@app.post("/grabar_alerta")
def endpoint_grabar_alerta():
    now = datetime.now().strftime("%Y%m%d_%H%M%S")
    video_path = VIDEOS_DIR / f"alerta_{now}.mp4"
    threading.Thread(target=grabar_video_alerta, args=(video_path,)).start()
    return {"message": "Grabación iniciada", "archivo": str(video_path.name)}

def registrar_alerta_en_db(tipo_alerta: str, nivel: str, video_path: str):
    alerta = {
        "tipo": tipo_alerta,
        "nivel": nivel,
        "ruta_video": video_path,
        "fecha": datetime.now()
    }
    db.alertas.insert_one(alerta)

# Obtener Usuario Específico (GET)
@app.get("/users/email/{user_email}", response_model=UserResponse2)
async def get_user_email(user_email: str):
    user = db.users.find_one({"email": user_email})
    if not user:
        raise HTTPException(
            status_code=404,
            detail=str(type(user))
        )
    
    return {
        "id": str(user["_id"]),
        "name": user["name"],
        "email": user["email"],
        "password": user["password"],
        "role": user["role"],
        "createdAt": user["createdAt"],
        "updatedAt": user["updatedAt"]
    }
# Obtener Usuario Específico (GET)
@app.get("/users/id/{user_id}", response_model=UserResponse)
async def get_user_id(user_id: str):
    user = db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(
            status_code=404,
            detail=str(type(user))
        )
    
    return {
        "id": str(user["_id"]),
        "name": user["name"],
        "email": user["email"],
        "role": user["role"],
        "createdAt": user["createdAt"],
        "updatedAt": user["updatedAt"]
    }

# Actualizar Usuario (PATCH)
@app.patch("/users/{user_id}", response_model=UserResponse)
async def update_user(user_id: str, user_update: UserUpdate):
    update_data = user_update.model_dump(exclude_unset=True)
    
    if not update_data:
        raise HTTPException(
            status_code=400,
            detail="No data provided for update"
        )
    
    if "role" in update_data and update_data["role"] not in ["admin", "operator"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid role. Must be 'admin' or 'operator'"
        )
    
    if "email" in update_data:
        if db.users.find_one({"email": update_data["email"], "_id": {"$ne": ObjectId(user_id)}}):
            raise HTTPException(
                status_code=400,
                detail="Email already in use by another user"
            )
    
    update_data["updatedAt"] = datetime.now()
    # Hashear la contraseña
    update_data["password"] = get_password_hash(update_data["password"])
    
    result = db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=404,
            detail="User not found or no changes made"
        )
    
    updated_user = db.users.find_one({"_id": ObjectId(user_id)})
    return {
        "id": str(updated_user["_id"]),
        "name": updated_user["name"],
        "email": updated_user["email"],
        "role": updated_user["role"],
        "createdAt": updated_user["createdAt"],
        "updatedAt": updated_user["updatedAt"]
    }

# Eliminar Usuario (DELETE)
@app.delete("/users/{user_id}", status_code=204)
async def delete_user(user_id: str):
    result = db.users.delete_one({"_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )
    return None

###### DEVICES ######################################################################

# CREATE
@app.post("/devices/", response_model=DeviceResponse, status_code=201)
async def create_device(device: DeviceCreate):
    if not device.name:
        raise HTTPException(status_code=404, detail="Name is a required field")
    
    device_data = device.model_dump()
    device_data["createdAt"] = device_data["updatedAt"] = datetime.now()
    
    result = db.devices.insert_one(device_data)
    created_device = db.devices.find_one({"_id": result.inserted_id})
    
    return {
        "id": str(created_device["_id"]),
        **device.model_dump(),
        "createdAt": created_device["createdAt"],
        "updatedAt": created_device["updatedAt"]
    }

# READ ALL
@app.get("/devices/", response_model=list[DeviceResponse])
async def get_devices(name: Optional[str] = None, location: Optional[str] = None, type: Optional[str] = None):
    query = {}
    if name:
        query["name"] = name
    if location:
        query["location"] = location
    if type:
        query["type"] = type

    devices = []
    
    for device in db.devices.find().sort("createdAt", -1): #falgta agregar el query#3333333
        devices.append({
            "id": str(device["_id"]),
            "name": device["name"],
            "status": device["status"],
            "type": device["type"],
            "model": device["model"],
            "location": device["location"],
            "createdAt": device["createdAt"],
            "updatedAt": device["updatedAt"]
        })
    return devices

# READ ONE
@app.get("/devices/{device_id}", response_model=DeviceResponse)
async def get_device(device_id: str):
    if not ObjectId.is_valid(device_id):
        raise HTTPException(status_code=400, detail="Invalid device ID format")
    
    device = db.devices.find_one({"_id": ObjectId(device_id)})
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    return {
        "id": str(device["_id"]),
        "name": device["name"],
        "status": device["status"],
        "type": device["type"],
        "model": device["model"],
        "location": device["location"],
        "createdAt": device["createdAt"],
        "updatedAt": device["updatedAt"]
    }

# UPDATE
@app.patch("/devices/{device_id}", response_model=DeviceResponse)
async def update_device(device_id: str, device_update: DeviceUpdate):
    if not ObjectId.is_valid(device_id):
        raise HTTPException(status_code=400, detail="Invalid device ID format")
    
    update_data = device_update.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No data provided for update")
    
    update_data["updatedAt"] = datetime.now()
    
    result = db.devices.update_one(
        {"_id": ObjectId(device_id)},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Device not found or no changes made")
    
    updated_device = db.devices.find_one({"_id": ObjectId(device_id)})
    return {
        "id": str(updated_device["_id"]),
        "name": updated_device["name"],
        "status": updated_device["status"],
        "type": updated_device["type"],
        "model": updated_device["model"],
        "location": updated_device["location"],
        "createdAt": updated_device["createdAt"],
        "updatedAt": updated_device["updatedAt"]
    }

# DELETE
@app.delete("/devices/{device_id}", status_code=204)
async def delete_device(device_id: str):
    if not ObjectId.is_valid(device_id):
        raise HTTPException(status_code=400, detail="Invalid device ID format")
    
    result = db.devices.delete_one({"_id": ObjectId(device_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Device not found")
    return None

############## VIDEO #########################################################################
#### CREATE VIDEO
@app.post("/videos/", response_model=VideoResponse, status_code=201)
async def create_video(video: VideoCreate):
    if not video.file_path:
        raise HTTPException(status_code=404, detail="File_path is a required field")
    
    video_data = video.model_dump()
    video_data["createdAt"] = video_data["updatedAt"] = datetime.now()
    
    result = db.videos.insert_one(video_data)
    created_video = db.videos.find_one({"_id": result.inserted_id})
    
    return {
        "id": str(created_video["_id"]),
        **video.model_dump(),
        "createdAt": created_video["createdAt"],
        "updatedAt": created_video["updatedAt"]
    }
####### Mostrar todos los videos
@app.get("/videos/", response_model=list[VideoResponse])
async def get_videos():
    videos = []
    
    for video in db.videos.find().sort("createdAt", -1):
        videos.append({
            "id": str(video["_id"]),
            "file_path": video["file_path"],
            "starts": video["starts"],
            "ends": video["ends"],
            "createdAt": video["createdAt"],
            "updatedAt": video["updatedAt"]
        })
    return videos


########## ALERTA ######################################################################

# CREATE
@app.post("/alerts/", response_model=AlertResponse, status_code=201)
async def create_alert(alert: AlertCreate):
    # Verificar que el dispositivo existe
    if not db.devices.find_one({"_id": ObjectId(alert.device.id)}):
        raise HTTPException(status_code=400, detail="Device not found")
    if not db.videos.find_one({"_id": ObjectId(alert.video.id)}):
        raise HTTPException(status_code=400, detail="Video not found")
    
    device = db.devices.find_one({"_id": ObjectId(alert.device.id)})
    video = db.videos.find_one({"_id": ObjectId(alert.video.id)})

    # Estructura de la alerta con los datos completos
    alert_data = {
        "status": alert.status,
        #"alert_type": alert.alert_type,
        #"priority": alert.priority,
        "device": {
            "id": str(device["_id"]),
            "name": device.get("name"),
            "location": device.get("location")
        },
        "video": {
            "id": str(video["_id"]),
            "file_path": video.get("file_path"),
            "starts": video.get("starts"),
            "ends": video.get("ends")
        },
        "createdAt": datetime.now(),
        "updatedAt": datetime.now()
    }

    
    #alert_data = alert.model_dump()
    #alert_data["createdAt"] = alert_data["updatedAt"] = datetime.now()
    #alert_data["video"]["createdAt"] = alert_data["video"]["updatedAt"] = datetime.now()
    
    # Convertir los IDs embebidos a ObjectId
    #try:
    #alert_data["device"]["_id"] = ObjectId(alert_data["device"]["_id"])
    #alert_data["video"]["_id"] = ObjectId()
    #except Exception as e:
    #    raise HTTPException(status_code=400, detail=e)
    #alert_data["device"]["_id"] = alert_data["device"]["id"]
    #alert_data["video"]["_id"] = ObjectId()
    
    
    
    # Insertar en la base de datos
    result = db.alerts.insert_one(alert_data)
    created_alert = db.alerts.find_one({"_id": result.inserted_id})
    #print(create_alert)
    return {
        "id": str(created_alert["_id"]),
        #**alert.model_dump(),
        "status": created_alert["status"],
        #"priority": created_alert["priority"],
        #"alert_type": created_alert["alert_type"],
        #"device": created_alert["device"],
        "device": {
            "id": created_alert["device"]["id"],
            "name": created_alert["device"]["name"],
            "location": created_alert["device"]["location"]
        },
        #"video": created_alert["video"],
        "video": {
            "id": created_alert["video"]["id"],
            "file_path": created_alert["video"]["file_path"],
            "starts": created_alert["video"]["starts"],
            "ends": created_alert["video"]["ends"]
        },
        "createdAt": created_alert["createdAt"],
        "updatedAt": created_alert["updatedAt"]
    }

# READ ALL (con nuevos filtros)
@app.get("/alerts/", response_model=list[AlertResponse])
async def get_alerts(
    status: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    alert_id: Optional[str] = None,
    device_name: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100)
):
    query = {}
    
    # Filtro por status
    if status:
        query["status"] = status
    
    # Filtro por rango de fechas
    if start_date or end_date:
        date_filter = {}
        if start_date:
            date_filter["$gte"] = start_date
        if end_date:
            date_filter["$lte"] = end_date
        query["createdAt"] = date_filter
    
    # Filtro por ID de alerta
    if alert_id:
        try:
            query["_id"] = ObjectId(alert_id)
        except:
            raise HTTPException(status_code=400, detail="Invalid alert ID format")
    
    # Filtro por nombre de dispositivo
    if device_name:
        query["device.name"] = device_name
    
    alerts = []
    for alert in db.alerts.find(query).skip(skip).limit(limit).sort("createdAt", -1):
        alerts.append({
            "id": str(alert["_id"]),
            "status": alert["status"],
            #"priority": alert["priority"],
            #"alert_type": alert["alert_type"],
            "device": {
                "id": str(alert["device"]["id"]),
                "name": alert["device"]["name"],
                "location": alert["device"].get("location")
            },
            "video": {
                "id": str(alert["video"]["id"]),
                "file_path": alert["video"]["file_path"],
                "starts": alert["video"]["starts"],
                "ends": alert["video"]["ends"],
                #"createdAt": alert["video"]["createdAt"],
                #"updatedAt": alert["video"]["updatedAt"]
            },
            "createdAt": alert["createdAt"],
            "updatedAt": alert["updatedAt"]
        })
    return alerts

# READ ONE
@app.get("/alerts/{alert_id}", response_model=AlertResponse)
async def get_alert(alert_id: str):
    if not ObjectId.is_valid(alert_id):
        raise HTTPException(status_code=400, detail="Invalid alert ID format")
    
    alert = db.alerts.find_one({"_id": ObjectId(alert_id)})
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    return {
        "id": str(alert["_id"]),
        "status": alert["status"],
        #"priority": alert["priority"],
        #"alert_type": alert["alert_type"],
        "device": {
            "id": str(alert["device"]["id"]),
            "name": alert["device"]["name"],
            "location": alert["device"].get("location")
        },
        "video": {
            "id": str(alert["video"]["id"]),
            "file_path": alert["video"]["file_path"],
            "starts": alert["video"]["starts"],#.strftime("%H:%M:%S"),
            "ends": alert["video"]["ends"]#.strftime("%H:%M:%S"),
            #"createdAt": alert["video"]["createdAt"],
            #"updatedAt": alert["video"]["updatedAt"]
        },
        "createdAt": alert["createdAt"],
        "updatedAt": alert["updatedAt"]
    }

# UPDATE
@app.patch("/alerts/{alert_id}", response_model=AlertResponse)
async def update_alert(alert_id: str, alert_update: AlertUpdate):
    if not ObjectId.is_valid(alert_id):
        raise HTTPException(status_code=400, detail="Invalid alert ID format")
    
    if not db.devices.find_one({"_id": ObjectId(alert_update.device.id)}):
        raise HTTPException(status_code=400, detail="Device not found")
    if not db.videos.find_one({"_id": ObjectId(alert_update.video.id)}):
        raise HTTPException(status_code=400, detail="Video not found")
    
    update_data = alert_update.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No data provided for update")
    
    
    
    update_data["updatedAt"] = datetime.now()
    
    result = db.alerts.update_one(
        {"_id": ObjectId(alert_id)},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Alert not found or no changes made")
    
    updated_alert = db.alerts.find_one({"_id": ObjectId(alert_id)})
    return {
        "id": str(updated_alert["_id"]),
        "status": updated_alert["status"],
        #"priority": updated_alert["priority"],
        #"alert_type": updated_alert["alert_type"],
        "device": {
            "id": str(updated_alert["device"]["id"]),
            "name": updated_alert["device"]["name"],
            "location": updated_alert["device"].get("location")
        },
        "video": {
            "id": str(updated_alert["video"]["id"]),
            "file_path": updated_alert["video"]["file_path"],
            "starts": updated_alert["video"]["starts"],
            "ends": updated_alert["video"]["ends"],
            #"createdAt": updated_alert["video"]["createdAt"],
            #"updatedAt": updated_alert["video"]["updatedAt"]
        },
        "createdAt": updated_alert["createdAt"],
        "updatedAt": updated_alert["updatedAt"]
    }

# DELETE
@app.delete("/alerts/{alert_id}", status_code=204)
async def delete_alert(alert_id: str):
    if not ObjectId.is_valid(alert_id):
        raise HTTPException(status_code=400, detail="Invalid alert ID format")
    
    result = db.alerts.delete_one({"_id": ObjectId(alert_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Alert not found")
    return None



############ aLERTA REPORTES ######################################

#@app.post("/save-alert")
#async def save_alert(alert: AlertCreate):
#    global current_id
#    new_alert = Alert(id=current_id, **alert.dict())
#    #alerts_db.append(new_alert)
#    current_id += 1
#    return {"message": "Alerta guardada", "alert": new_alert}

#@app.get("/reports", response_model=list[Alert])
#def get_reports():
    #return alerts_db

#@app.get("/reports/export")
#def export_reports():
    #if not alerts_db:
     #   return {"message": "No hay reportes"}

    #df = pd.DataFrame([alert.dict() for alert in alerts_db])
    #file_path = "reporte_alertas.xlsx"
    #df.to_excel(file_path, index=False)
    #return FileResponse(file_path, media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', filename=file_path)



## Endpoints para el login #######

@app.options("/get/token")
async def options_token():
    return Response(headers={
        "Access-Control-Allow-Origin": "http://localhost:4200",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    })


@app.post("/get/token", response_model=Token)
async def login_for_access_token(
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends()):
    
    print("entro al post", form_data.username, form_data.password)
    response.headers["Access-Control-Allow-Origin"] = "http://localhost:4200"
    response.headers["Access-Control-Allow-Credentials"] = "true"
    user = db.users.find_one({"email": form_data.username})
    print('0', form_data.password, user["password"])
    if not user or not verify_password(form_data.password, user["password"]):
    #if not user or not form_data.password == user["password"]:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    print('1')

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    print('2')
    access_token = create_access_token(
        data={"sub": user["email"]}, expires_delta=access_token_expires
    )
    print('3')
    return {"access_token": access_token, "token_type": "bearer"}

# Endpoint protegido de ejemplo
@app.get("/users/me", response_model=UserResponse)
async def read_users_me(token: str = Depends(oauth2_scheme)):
    print("/users/me dentro" )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=400, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    print("try completo")
    user = db.users.find_one({"email": email})
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    print("antes del return")
    return {
        "id": str(user["_id"]),
        "name": user["name"],
        "email": user["email"],
        "password": user["password"],
        "role": user["role"],
        "createdAt": str(user["createdAt"]),
        "updatedAt": str(user["updatedAt"])

    }

