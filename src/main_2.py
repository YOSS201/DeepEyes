from fastapi import FastAPI, HTTPException, status, Query, Depends, Response, WebSocket, WebSocketDisconnect
from pymongo import MongoClient
from typing import Optional
import os
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from bson.objectid import ObjectId


from fastapi.responses import StreamingResponse
import cv2

from fastapi.responses import StreamingResponse, FileResponse, HTMLResponse
from datetime import datetime, timedelta

from models import UserCreate, UserUpdate, UserResponse, UserResponse2
from models import DeviceCreate, DeviceUpdate, DeviceResponse
from models import AlertCreate, AlertUpdate, AlertResponse
from models import VideoCreate, VideoResponse
from models import ReportCreate, ReportResponse
from models import ConfigCreate, ConfigResponse


from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from models import Token, TokenData

import logging
import threading
from pathlib import Path
import subprocess
from threading import Lock

from ultralytics import YOLO

import asyncio
import httpx

import time

from collections import deque

import io
import pandas as pd

import gridfs


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
YOLO_MODEL_PATH = MODELS_DIR / "my_model_person_v4.pt"

# Cargar modelo
yolo_model = YOLO(str(YOLO_MODEL_PATH))
yolo_model.fuse()  # Optimiza el modelo para inferencia (opcional pero igual le metemos)



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
# class_names = [
#     "Product", "normal", "shoplifting"
# ]

# ---- Inicializar la cámara ---- ##################################################################3



# Variables globales
camera_active = False
video_capture = None
porcentage_detection = 0.5
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

def load_porcentage_detection():
    try:
        configs = db.configs.find_one({"_id": ObjectId('685e9a03bf4ad310a1658d99')})    
        return configs["deteccion"]
    except Exception as e:
        print("error al obtener configs: " + str(e))
        return 0.5  # Return default if error
    
porcentage_detection = load_porcentage_detection()
print(f"porcentage_detection = {porcentage_detection}")


#atexit.register(release_camera)

# ---- Funciones de detección ----
#def detect_faces(gray_frame):
#    return face_cascade.detectMultiScale(gray_frame, scaleFactor=1.1, minNeighbors=5)
#
#def detect_objects(frame):
#    blob = cv2.dnn.blobFromImage(cv2.resize(frame, (300, 300)), 0.007843, (300, 300), 127.5)
#    net.setInput(blob)
#    return net.forward()

def detect_objects(frame): ## NUEVO
    results = yolo_model(frame, imgsz=640, conf=0.8, device="cpu") # cambiar "device" de "cpu" a "cuda" si se usa GPU
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

def draw_object_boxes(frame, detections, threshold=0.8):
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
# Variable global para controlar el último tiempo de alerta
# last_alert_time = None
# async def trigger_alert(): #frame, detections
#     global last_alert_time
    
#     # Verificar si ha pasado el tiempo mínimo entre alertas
#     current_time = datetime.now()
#     if last_alert_time and (current_time - last_alert_time) < timedelta(seconds=10):
#         print("Alerta suprimida (cooldown activo)")
#         return False
    
#     try:
#         device = db.devices.find_one({"_id": ObjectId("681abdcd5e3e0959ba785ce9")})
#         video = db.videos.find_one({"_id": ObjectId("681ba1a709f81d577139f29d")})
#         # Guardar imagen de evidencia
#         #_, buffer = cv2.imencode('.jpg', frame)
#         #image_bytes = buffer.tobytes()
        
#         # Llamar a tu endpoint existente
#         async with httpx.AsyncClient() as client:
#             print("Se mandan los datos de alerta")
#             response = await client.post(
#                 "http://127.0.0.1:8000/alerts",
#                 #files={"evidence": image_bytes},
#                 data={
#                     #"type": "theft",
#                     #"confidence": max(box.conf.item() for box in detections.boxes),
#                     #"timestamp": current_time.isoformat(),
#                     #"location": "Cámara 1"  # Ajustar según cámara
#                     "status": "pending",
#                     #"alert_type": alert.alert_type,
#                     #"priority": alert.priority,
#                     "device": {
#                         "id": str(device["_id"]),
#                         "name": device.get("name"),
#                         "location": device.get("location")
#                     },
#                     "video": {
#                         "id": str(video["_id"]),
#                         "file_path": video.get("file_path"),
#                         "starts": video.get("starts"),
#                         "ends": video.get("ends")
#                     },
#                     "createdAt": datetime.now(),
#                     "updatedAt": datetime.now()
#                 }
#             )

#         # Actualizar el tiempo de la última alerta
#         last_alert_time = current_time
#         print(f"Alerta enviada a las {current_time}")
#         return response.status_code == 200
        
#     except Exception as e:
#         print(f"Error enviando alerta: {e}")
#         return False


# Diccionario para almacenar los streams de video
camera_streams = {
    "camera1": 1,  # Puede ser un índice (0 para la primera cámara), o una URL/IP
    "camera2": 2   # Segunda cámara
}

class AlertManager:
    def __init__(self, cooldown_seconds=10, buffer_seconds=12, default_fps=30):
        self.last_alert_time = {}
        self.cooldown = timedelta(seconds=cooldown_seconds)
        self.default_fps = default_fps
        self.buffer_seconds = buffer_seconds  # Buffer for 12s (2s before + 10s after)
        self.frame_buffers = {}  # {camera_id: deque([(timestamp, annotated_frame), ...])}
        self.fps_measurements = {}  # {camera_id: list of frame intervals}
        self.video_save_path = "assets/videos"
        os.makedirs(self.video_save_path, exist_ok=True)
        self.alert_trigger_time = {}  # {camera_id: timestamp of last alert trigger}

        # Conexión a MongoDB Atlas para GridFS
        # self.mongo_client = MongoClient("tu_cadena_de_conexion_atlas")
        # self.db = self.mongo_client["tu_base_de_datos"]
        self.fs = gridfs.GridFS(db)

    def _get_video_filename(self, camera_id):
        """Generate unique filename for video based on timestamp and camera ID."""
        timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
        # return os.path.join(self.video_save_path, f"alert_{camera_id}_{timestamp}.mp4")
        return f"{self.video_save_path}/alert_{camera_id}_{timestamp}.mp4"

    def _calculate_fps(self, camera_id):
        """Calculate actual FPS based on recent frame intervals."""
        if camera_id not in self.fps_measurements or len(self.fps_measurements[camera_id]) < 2:
            return self.default_fps
        intervals = self.fps_measurements[camera_id]
        avg_interval = (sum(intervals) / len(intervals)) * 2 #############################################
        fps = 1.0 / avg_interval if avg_interval > 0 else self.default_fps
        return min(max(fps, 1.0), self.default_fps)
    
    async def upload_video_to_mongodb(self, file_path, created_alert):
        """Sube el video a MongoDB GridFS y actualiza la alerta"""
        try:
            with open(file_path, 'rb') as video_file:
                video_id = self.fs.put(video_file, filename=os.path.basename(file_path))
            # Actualizar la alerta con el ID del video en GridFS
            async with httpx.AsyncClient() as client:
                created_alert["video_backup"] = str(video_id)
                response = await client.patch(
                    f"http://127.0.0.1:8000/alerts/{created_alert["id"]}",
                    json=created_alert
                        # "status": created_alert["status"],
                        # "device": {
                        #     "id": created_alert["device"]["id"],
                        #     "name": created_alert.device.name,
                        #     "location": created_alert.device.location
                        # },
                        # "video": created_alert.video,
                        # "video_backup": str(video_id)
                    ,
                    headers={"Content-Type": "application/json"},
                    timeout=30.0  # Tiempo mayor para la subida
                )
                
            if response.is_success:
                print(f"Video subido a MongoDB y alerta actualizada: {created_alert["id"]}")
            else:
                print(f"Error al subido a MongoDB y actualizar alerta: {response.text}")
                
            return str(video_id)
        except Exception as e:
            print(f"Error subiendo video a MongoDB: {str(e)}")
            return None

    async def save_alert_video(self, camera_id, video_path, frame_size, created_alert):####
        """Save video clip: 2s before and 10s after alert."""
        try:
            # Use measured FPS for video playback
            fps = self._calculate_fps(camera_id)
            print(f"[{camera_id}] Using FPS: {fps:.2f} for video")
            fourcc = cv2.VideoWriter_fourcc(*'avc1')
            #video_path = self._get_video_filename(camera_id)
            out = cv2.VideoWriter(video_path, fourcc, fps, frame_size)

            #datos video
            video_data = {
                "file_path": video_path,
                "starts": "2025-06-20T22:24:52.582Z", #datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
                "ends": "2025-06-20T22:24:52.582Z"
            }

            # CREAR VIDEO
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "http://127.0.0.1:8000/videos/",
                    json=video_data,  
                    headers={"Content-Type": "application/json"},
                    timeout=10.0
                )

            # Wait to collect post-alert frames
            await asyncio.sleep(self.buffer_seconds - 2.0)  # Wait for 10s of post-alert frames

            # Write frames from buffer (2s before, trigger, 10s after)
            if camera_id in self.frame_buffers and camera_id in self.alert_trigger_time:
                trigger_time = self.alert_trigger_time[camera_id]
                start_time = trigger_time - timedelta(seconds=2)  # 2s before
                end_time = trigger_time + timedelta(seconds=self.buffer_seconds)  # 10s after
                frame_count = 0
                for timestamp, frame in sorted(self.frame_buffers[camera_id], key=lambda x: x[0]):
                    if start_time <= timestamp <= end_time:
                        out.write(frame)
                        frame_count += 1
                print(f"[{camera_id}] Wrote {frame_count} frames to video")

            out.release()
            print(f"[{camera_id}] Video saved at {video_path}")

            # Subir el video a MongoDB
            #await self.upload_video_to_mongodb(video_path, created_alert)
        except Exception as e:
            print(f"[{camera_id}] Error saving video: {str(e)}")

    ####################
    async def trigger_alert(self, frame, camera_id):
        current_time = datetime.now()
        video_path = self._get_video_filename(camera_id)
        
        # Check cooldown
        if camera_id in self.last_alert_time:
            time_since_last = current_time - self.last_alert_time[camera_id]
            if time_since_last < self.cooldown:
                print(f"[{camera_id}] Alerta suprimida (cooldown activo por {self.cooldown - time_since_last} más)")
                return False
        
        try:
            print(f"camera_id: {camera_id}")
            # buscar camara en bd por posición
            new_device = db.devices.find_one({"position": camera_id})
            
            print(f"new_device_id: {new_device["_id"]}")

            # Encode evidence image
            #_, buffer = cv2.imencode('.jpg', frame)
            alert_data = {
                "status": "pending",
                "device": {
                    "id": str(new_device["_id"])
                },
                "video": video_path,
                "video_backup": "" # Se actualiza después
            }
            
            # Send alert to endpoint
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "http://127.0.0.1:8000/alerts/",
                    json=alert_data,  
                    headers={"Content-Type": "application/json"},
                    timeout=10.0
                )
            
            if response.is_success:
                created_alert = response.json()
                

                self.last_alert_time[camera_id] = current_time
                self.alert_trigger_time[camera_id] = current_time  # Store trigger time
                print(f"[{camera_id}] Alerta enviada exitosamente")
                
                # Save video clip (2s before + 10s after) using buffer
                #annotated_frame = detections.plot()
                frame_size = (frame.shape[1], frame.shape[0])  # (width, height)

                # Obtener los datos JSON de la respuesta
                # created_alert = response.json()
                # alert_id = created_alert["id"]

                asyncio.create_task(self.save_alert_video(camera_id, video_path, frame_size, created_alert))
                return True
            else:
                print(f"[{camera_id}] Error al enviar alerta", response.text)
                
        except Exception as e:
            print(f"[{camera_id}] Error enviando alerta: {str(e)}")
        
        return False

    def update_frame_buffer(self, camera_id, frame, timestamp):
        """Maintain a buffer of annotated frames for each camera."""
        if camera_id not in self.frame_buffers:
            self.frame_buffers[camera_id] = deque(maxlen=int(self.default_fps * self.buffer_seconds))
        
        self.frame_buffers[camera_id].append((timestamp, frame))

    def check_and_restore_video(self, video_path, alert_data):
        """Verifica si existe el video local y si no, lo descarga de MongoDB"""
        if os.path.exists(video_path):
            return True
            
        if "video_backup" in alert_data and alert_data["video_backup"]:
            return self.download_video_from_mongodb(alert_data["video_backup"], video_path)
            
        return False
    
    async def download_video_from_mongodb(self, video_backup_id, target_path):
        """Descarga un video desde MongoDB GridFS"""
        try:
            video_data = self.fs.get(video_backup_id)
            with open(target_path, 'wb') as video_file:
                video_file.write(video_data.read())
            print(f"Video descargado desde MongoDB: {target_path}")
            return True
        except Exception as e:
            print(f"Error descargando video desde MongoDB: {str(e)}")
            return False


# Initialize alert manager
alert_manager = AlertManager(cooldown_seconds=10, buffer_seconds=12, default_fps=30)

# Function to process camera frames
async def process_camera(camera_id: str):
    cap = cv2.VideoCapture(camera_streams[camera_id])
    try:
        while True:
            start_time = time.time()
            ret, frame = cap.read()
            if not ret:
                break
            
            # Object detection
            results = yolo_model(frame, verbose=False)
            detections = results[0]
            annotated_frame = detections.plot()
            current_time = datetime.now()

            # Update frame buffer with annotated frame
            alert_manager.update_frame_buffer(camera_id, annotated_frame, current_time)
            
            # Update FPS measurement
            frame_time = time.time() - start_time
            if camera_id not in alert_manager.fps_measurements:
                alert_manager.fps_measurements[camera_id] = deque(maxlen=100)
            alert_manager.fps_measurements[camera_id].append(frame_time)
            
            # Check for relevant detections
            for box in detections.boxes:
                class_id = int(box.cls.item())
                class_name = detections.names[class_id]
                conf = box.conf.item()
                
                # Alert condition
                if class_name == "shoplifting" and conf > porcentage_detection:
                    print(f"DETECCIÓN----- confidence: {conf} --- procentage_detection: {porcentage_detection}") 
                    await alert_manager.trigger_alert(frame, camera_id)
                    break  # Only one alert per frame

            # Convert to JPEG for streaming
            _, buffer = cv2.imencode('.jpg', annotated_frame)
            yield buffer.tobytes()
            
            # Sleep to avoid overloading the system
            await asyncio.sleep(0.01)  # Minimal sleep to yield control
    except Exception as e:
        print(f"Error en cámara {camera_id}: {e}")
    finally:
        cap.release()

# ---- Generar transmisión ----
# async def generate_frames():
#     init_camera()  # Asegurar que la cámara esté encendida
#     while camera_active:  # Solo mientras la cámara esté activa
#         with capture_lock:
#             if video_capture is None or not video_capture.isOpened():
#                 break
#             ret, frame = video_capture.read()
        
#         if not ret:
#             logging.warning("No se capturó el frame.")
#             continue
        
#         try:
#             #gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)###############################################################################################################
#             #faces = detect_faces(gray) ###############################################################################################################
#             detections = detect_objects(frame)
#             logging.info("1")
#             # Verificar cada detección
#             for box in detections.boxes:
#                 class_id = int(box.cls.item())
#                 class_name = yolo_model.names[class_id]
#                 conf = box.conf.item()
#                 logging.error("2")
#                 # Si es un hurto y confianza alta
#                 if class_name == "shoplifting" and conf > 0.70:  # Ajusta el umbral
#                     print("Detección shoplifting > 70%")
#                     await trigger_alert() #frame, detections
#                     break  # Solo una alerta por frame



#             #draw_face_boxes(frame, faces) ###############################################################################################################
#             draw_object_boxes(frame, detections)

#             ret, buffer = cv2.imencode('.jpg', frame)
#             if not ret:
#                 continue

#             yield (b'--frame\r\n'
#                    b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')
#         except Exception as e:
#             logging.error(f"Error procesando frame: {e}")
        
#         await asyncio.sleep(0.2)  # Controlar tasa de frames



# ---- Grabar video alerta ----
def grabar_video_alerta(path: Path, duracion=10, width=640, height=480):
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(str(path), fourcc, 20.0, (width, height))
    start_time = datetime.now()

    while (datetime.now() - start_time).seconds < duracion:
        with capture_lock:
            ret, frame = video_capture.read()
        if not ret:
            logging.warning("No se pudo capturar frame durante grabación.")
            continue
        
        # Procesar el frame igual que en generate_frames
        try:
            #gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)###############################################################################################################
            #faces = detect_faces(gray) ###############################################################################################################
            detections = detect_objects(frame)
            
            #draw_face_boxes(frame, faces) ###############################################################################################################
            draw_object_boxes(frame, detections)
            
            out.write(frame)  # Grabar el frame procesado
            
        except Exception as e:
            logging.error(f"Error procesando frame durante grabación: {e}")

    out.release()
    logging.info(f"Video guardado: {path.name}")

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
# WebSocket para múltiples cámaras
@app.websocket("/ws/{camera_id}")
async def websocket_endpoint(websocket: WebSocket, camera_id: str):
    await websocket.accept()
    try:
        async for frame in process_camera(camera_id):
            await websocket.send_bytes(frame)
    except WebSocketDisconnect:
        print(f"Cliente {camera_id} desconectado")
    except Exception as e:
        print(f"Error en cámara {camera_id}: {e}")
    # finally:
    #     try:
    #         # Verificar si la conexión todavía está activa antes de cerrar
    #         if websocket.client_state != "disconnected":
    #             await websocket.close()
    #     except Exception as e:
    #         print(f"Error al cerrar WebSocket para cámara {camera_id}: {e}")



# Endpoint para obtener el video en streaming
# ---- Endpoint de streaming ----
@app.get("/", response_class=HTMLResponse)
async def root():
    return """
    <html><head><title>Servidor de Cámara</title></head>
    <body>
        <h1>Servidor funcionando ✅</h1>
        <p><a href="/docs">Ir a Docs</a></p>
    </body></html>
    """

@app.get("/get_video/{video_name}")
async def get_video(video_name: str):
    video_path = f"assets/videos/{video_name}"
    if not os.path.exists(video_path):
        return {"error": "Video no encontrado"}
    return FileResponse(video_path)

# @app.get("/video")
# async def video():
#     if not camera_active:
#         init_camera()
#     logging.info("Cliente conectado a /video")
#     return StreamingResponse(
#         generate_frames(), 
#         media_type="multipart/x-mixed-replace; boundary=frame"
#     )

# @app.post("/camera/start")
# async def start_camera():
#     init_camera()
#     return {"message": "Cámara encendida", "status": camera_active}

# @app.post("/camera/stop")
# async def stop_camera():
#     release_camera()
#     return {"message": "Cámara apagada", "status": camera_active}

# @app.get("/camera/status")
# async def camera_status():
#     return camera_active

#@app.get("/grabar-alerta")
#async def grabar_alerta(duracion: int = 10):
#    nombre = f"alerta_{datetime.now().strftime('%Y%m%d_%H%M%S')}.mp4"
#    path = VIDEOS_DIR / nombre
#    grabar_video_alerta(path, duracion)
#    return FileResponse(str(path), media_type='video/mp4', filename=nombre)

# @app.post("/start_recording")
# async def start_recording():
#     nombre = f"grabacion_{datetime.now().strftime('%Y%m%d_%H%M%S')}.mp4"
#     path = VIDEOS_DIR / nombre
#     thread = threading.Thread(target=grabar_video_alerta, args=(path, 10), daemon=True)
#     thread.start()
#     return {"message": f"Grabación iniciada: {nombre}"}

  
@app.post("/stop_recording")
async def stop_recording():
    try:
        # Tu lógica aquí
        return {"message": "Grabación detenida"}
    except Exception as e:
        print("Error al detener grabación:", e)
        raise HTTPException(status_code=500, detail=str(e))

# @app.on_event("shutdown")
# def shutdown_event():
#     release_camera()
#     logging.info("Liberando recursos de la cámara al cerrar la aplicación")



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
    
    if(db.devices.find_one({"position": device.position})):
        raise HTTPException(status_code=404, detail="Esa posición de cámara ya está tomada")
    
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
async def get_devices(name: Optional[str] = None,
    position: Optional[str] = None, location: Optional[str] = None, type: Optional[str] = None):
    query = {}
    if name:
        query["name"] = name
    if position:
        query["position"] = position
    if location:
        query["location"] = location
    if type:
        query["type"] = type
    

    devices = []
    
    for device in db.devices.find().sort("createdAt", -1): #falgta agregar el query#3333333
        devices.append({
            "id": str(device["_id"]),
            "name": device["name"],
            "position": device["position"],
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
        "position": device["position"],
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
    
    device_pos_exists = db.devices.find_one({"position": device_update.position})
    if(device_pos_exists and 
       device_pos_exists != db.devices.find_one({"_id": ObjectId(device_id)})):
        raise HTTPException(status_code=400, detail="Esa posición de cámara ya está tomada")


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
        "position": updated_device["position"],
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
    #if not db.videos.find_one({"_id": ObjectId(alert.video.id)}):
    #    raise HTTPException(status_code=400, detail="Video not found")
    
    device = db.devices.find_one({"_id": ObjectId(alert.device.id)})
    #video = db.videos.find_one({"_id": ObjectId(alert.video.id)})

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
        "video": alert.video,
        "video_backup": alert.video_backup,

        # "video": {
        #     "id": str(alert["video"]["id"]),
        #     "file_path": alert["video"]["file_path"],
        #     "starts": alert["video"]["starts"],
        #     "ends": alert["video"]["ends"],
        #     #"createdAt": alert["video"]["createdAt"],
        #     #"updatedAt": alert["video"]["updatedAt"]
        # },
            
        "createdAt": datetime.now(),
        "updatedAt": datetime.now()
    }
    
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
        "video": created_alert["video"],
        "video_backup": created_alert["video_backup"],
        # "video": {
        #     "id": created_alert["video"]["id"],
        #     "file_path": created_alert["video"]["file_path"],
        #     "starts": created_alert["video"]["starts"],
        #     "ends": created_alert["video"]["ends"]
        # },
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
            "video": alert["video"],
            "video_backup": alert["video_backup"],
            # "video": {
            #     "id": str(alert["video"]["id"]),
            #     "file_path": alert["video"]["file_path"],
            #     "starts": alert["video"]["starts"],
            #     "ends": alert["video"]["ends"],
            #     #"createdAt": alert["video"]["createdAt"],
            #     #"updatedAt": alert["video"]["updatedAt"]
            # },
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
        "video": alert["video"],
        "video_backup": alert["video_backup"],
        # "video": {
        #     "id": str(alert["video"]["id"]),
        #     "file_path": alert["video"]["file_path"],
        #     "starts": alert["video"]["starts"],
        #     "ends": alert["video"]["ends"],
        #     #"createdAt": alert["video"]["createdAt"],
        #     #"updatedAt": alert["video"]["updatedAt"]
        # },

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
    # if not db.videos.find_one({"_id": ObjectId(alert_update.video.id)}):
    #     raise HTTPException(status_code=400, detail="Video not found")
    
    # device = db.device.find_one({"_id": ObjectId(alert_update.device.id)})
    # video = db.video.find_one({"_id": ObjectId(alert_update.video.id)})
    
    update_data = alert_update.model_dump(exclude_unset=True)
    # update_data = {
    #     "status": alert_update.status,
    #     #"alert_type": alert.alert_type,
    #     #"priority": alert.priority,
    #     "device": {
    #         "id": str(device["_id"]),
    #         "name": device.name,
    #         "location": device.location
    #     },
    #     "video": alert_update.video
    #     # "video": {
    #     #     "_id": str(video["_id"]),
    #     #     "file_path": video.get("file_path"),
    #     #     "starts": video.get("starts"),
    #     #     "ends": video.get("ends")
    #     # },
    # }
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
        "video": updated_alert["video"],
        "video_backup": updated_alert["video_backup"],
        # "video": {
        #     "id": str(updated_alert["video"]["id"]),
        #     "file_path": updated_alert["video"]["file_path"],
        #     "starts": updated_alert["video"]["starts"],
        #     "ends": updated_alert["video"]["ends"],
        #     #"createdAt": updated_alert["video"]["createdAt"],
        #     #"updatedAt": updated_alert["video"]["updatedAt"]
        # },
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



############ REPORTES ######################################
# CREATE REPORT
@app.post("/reports/", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
async def create_report(report: ReportCreate):
    try:
        # Validar que los alert_ids existen (opcional)
        # for alert_id in report.alert_ids:
        #     if not db.alerts.find_one({"_id": ObjectId(alert_id)}):
        #         raise HTTPException(status_code=404, detail=f"Alert ID {alert_id} not found")
        
        now = datetime.now()
        report_data = {
            "alert_ids": report.alert_ids,
            "filters": report.filters,
            "user_name": report.user_name,
            "createdAt": now,
            "updatedAt": now
        }
        
        result = db.reports.insert_one(report_data)
        created_report = db.reports.find_one({"_id": result.inserted_id})
        
        return {
            "id": str(created_report["_id"]),
            "alert_ids": created_report["alert_ids"],
            "filters": created_report["filters"],
            "user_name": created_report["user_name"],
            "createdAt": created_report["createdAt"],
            "updatedAt": created_report["updatedAt"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# GET ALL REPORTS
@app.get("/reports/", response_model=list[ReportResponse])
async def get_reports(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100)
):
    try:
        reports = []
        for report in db.reports.find().skip(skip).limit(limit).sort("createdAt", -1):
            reports.append({
                "id": str(report["_id"]),
                "alert_ids": report["alert_ids"],
                "filters": report["filters"],
                "user_name": report["user_name"],
                "createdAt": report["createdAt"],
                "updatedAt": report["updatedAt"]
            })
        return reports
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# GET SINGLE REPORT
@app.get("/reports/{report_id}", response_model=ReportResponse)
async def get_report(report_id: str):
    try:
        report = db.reports.find_one({"_id": ObjectId(report_id)})
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
        
        return {
            "id": str(report["_id"]),
            "alert_ids": report["alert_ids"],
            "filters": report["filters"],
            "user_name": report["user_name"],
            "createdAt": report["createdAt"],
            "updatedAt": report["updatedAt"]
        }
    except:
        raise HTTPException(status_code=400, detail="Invalid report ID format")

# DELETE REPORT
@app.delete("/reports/{report_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_report(report_id: str):
    try:
        result = db.reports.delete_one({"_id": ObjectId(report_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Report not found")
        return None
    except:
        raise HTTPException(status_code=400, detail="Invalid report ID format")

from typing import List
# Exportar a Excel
@app.get("/reports/export_report/")
async def export_alerts_to_excel(
    status: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    device_name: Optional[str] = None,
    alert_ids: Optional[List[str]] = Query(None),  # Cambiado a lista de strings
):
    try:
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
        # Filtro por lista de IDs de alerta
        if alert_ids:
            try:
                # Convertir cada string ID a ObjectId
                object_ids = [ObjectId(alert_id) for alert_id in alert_ids]
                query["_id"] = {"$in": object_ids}  # Usar operador $in para buscar en la lista
            except:
                raise HTTPException(status_code=400, detail="Invalid alert ID format")

        alerts = []
        for alert in db.alerts.find(query).sort("createdAt", -1):
            alerts.append({
                "id": str(alert["_id"]),
                "status": alert["status"],
                "device_id": str(alert["device"]["id"]),
                "device_name": alert["device"]["name"],
                "device_location": alert["device"].get("location"),
                "video_url": alert["video"],
                "created_at": alert["createdAt"],
                "updated_at": alert["updatedAt"]
            })

        if not alerts:
            raise HTTPException(status_code=404, detail="No alerts found with the specified filters")

        # Convertir a DataFrame
        df = pd.DataFrame(alerts)
        
        # Crear archivo Excel en memoria
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='Reporte de Alertas')
        
        output.seek(0)
        
        headers = {
            'Content-Disposition': 'attachment; filename="reporte_alertas.xlsx"',
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
        
        return StreamingResponse(output, headers=headers)

    except ImportError as e:
        raise HTTPException(
            status_code=500,
            detail="Required Excel export libraries are not installed. Please install openpyxl or xlsxwriter."
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating Excel report: {str(e)}"
        )

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

###############################  CONFIG  ############################################
#####CREATE ###############
@app.post("/configs/", response_model=ConfigResponse, status_code=201)
async def create_config(config: ConfigCreate):
    config_data = config.model_dump()
    config_data["createdAt"] = config_data["updatedAt"] = datetime.now()
    
    result = db.configs.insert_one(config_data)
    created_config = db.configs.find_one({"_id": result.inserted_id})
    return {
        "id": str(created_config["_id"]),
        **config.model_dump(),
        "createdAt": created_config["createdAt"],
        "updatedAt": created_config["updatedAt"]
    }

# READ ALL
@app.get("/configs/", response_model=list[ConfigResponse])
async def get_configs():
    configs = []
    for config in db.configs.find().sort("createdAt", -1): #falgta agregar el query#3333333
        configs.append({
            "id": str(config["_id"]),
            "user_id": config["user_id"],
            "auto": config["auto"],
            "sonido": config["sonido"],
            "notif": config["notif"],
            "volumen": config["volumen"],
            "deteccion": config["deteccion"],
            "createdAt": config["createdAt"],
            "updatedAt": config["updatedAt"]
        })
    return configs


@app.patch("/configs/{config_id}", response_model=ConfigResponse)
async def update_config(config_id: str, config_update: ConfigCreate):
    if not ObjectId.is_valid(config_id):
        raise HTTPException(status_code=400, detail="Invalid device ID format")
    update_data = config_update.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No data provided for update")
    
    update_data["updatedAt"] = datetime.now()
    
    result = db.configs.update_one(
        {"_id": ObjectId(config_id)},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Device not found or no changes made")
    
    updated_config = db.configs.find_one({"_id": ObjectId(config_id)})
    porcentage_detection = update_data["deteccion"]
    print(f"percentage######{porcentage_detection}")
    return {
        "id": str(updated_config["_id"]),
        "user_id": updated_config["user_id"],
        "auto": updated_config["auto"],
        "sonido": updated_config["sonido"],
        "notif": updated_config["notif"],
        "volumen": updated_config["volumen"],
        "deteccion": updated_config["deteccion"],
        "createdAt": updated_config["createdAt"],
        "updatedAt": updated_config["updatedAt"]
    }

# # Endpoint para verificar existencia local (opcional)
# @app.head("/videos/{video_name}")
# async def check_video_exists(video_name: str):
#     video_path = f"C:/Users/KARIM/Desktop/angular_ultimo/angular_ult/src/assets/videos/{video_name}"
#     if os.path.exists(video_path):
#         return Response(status_code=200)
#     return Response(status_code=404)

# Endpoint para verificar si un video existe en tu API
@app.get("/video_exists/{video_name}")
async def video_exists(video_name: str):
    video_path = os.path.join("C:/Users/KARIM/Desktop/angular_ultimo/angular_ult/src/assets/videos/", video_name)
    return {"exists": os.path.exists(video_path)}  # Devuelve un objeto JSON



# Endpoint para descargar desde GridFS
@app.get("/alerts/{alert_id}/download_video")
async def download_video(alert_id: str):
    # 1. Obtener la alerta para conseguir el video_backup_id
    alert = db.alerts.find_one({"_id": ObjectId(alert_id)})
    if not alert or "video_backup" not in alert:
        raise HTTPException(status_code=404, detail="Video not found")
    
    # 2. Obtener el video de GridFS
    fs = gridfs.GridFS(db)
    video_file = fs.get(ObjectId(alert["video_backup"]))
    
    # 3. Streamear el video
    return StreamingResponse(
        video_file,
        media_type="video/mp4",
        headers={
            "Content-Disposition": f"attachment; filename={video_file.filename}"
        }
    )

@app.post("/set-detection")
def set_detection(detection: float):
    porcentage_detection=detection
    return porcentage_detection

@app.get("/get-detection")
def get_detecetion():
    return porcentage_detection