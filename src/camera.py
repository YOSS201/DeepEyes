from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import cv2
from datetime import datetime 
import os
# ---- Configuración de FastAPI ----
camera = FastAPI()

camera.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],  # Permite solicitudes desde Angular en localhost
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Obtener ruta absoluta al directorio donde está ubicado este script
base_path = os.path.dirname(os.path.abspath(__file__))

# Rutas absolutas a los modelos dentro de la carpeta "modelos"
prototxt_path = os.path.join(base_path, "modelos", "MobileNetSSD_deploy.prototxt")
caffemodel_path = os.path.join(base_path, "modelos", "MobileNetSSD_deploy.caffemodel")

# ---- Cargar modelos de detección ----
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
net = cv2.dnn.readNetFromCaffe(prototxt_path, caffemodel_path)

class_names = [
    "background", "aeroplane", "bicycle", "bird", "boat",
    "bottle", "bus", "car", "cat", "chair", "cow", "diningtable",
    "dog", "horse", "motorbike", "person", "pottedplant", "sheep",
    "sofa", "train", "tvmonitor"
]

# ---- Inicializar la cámara ----
video_capture = cv2.VideoCapture(0)
if not video_capture.isOpened():
    raise HTTPException(status_code=500, detail="No se pudo acceder a la cámara")
else:
    print("Cámara abierta correctamente.")

# ---- Funciones de detección ----
def detect_faces(gray_frame):
    return face_cascade.detectMultiScale(gray_frame, scaleFactor=1.1, minNeighbors=5)

def detect_objects(frame, conf_threshold=0.2):
    blob = cv2.dnn.blobFromImage(cv2.resize(frame, (300, 300)), 0.007843, (300, 300), 127.5)
    net.setInput(blob)
    return net.forward()

def draw_face_boxes(frame, faces):
    for (x, y, w, h) in faces:
        cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)

def draw_object_boxes(frame, detections, conf_threshold=0.2):
    h, w = frame.shape[:2]
    for i in range(detections.shape[2]):
        confidence = detections[0, 0, i, 2]
        if confidence > conf_threshold:
            class_id = int(detections[0, 0, i, 1])
            box = detections[0, 0, i, 3:7] * [w, h, w, h]
            (startX, startY, endX, endY) = box.astype("int")
            label = f"{class_names[class_id]}: {confidence:.2f}"
            cv2.rectangle(frame, (startX, startY), (endX, endY), (255, 0, 0), 2)
            y = startY - 10 if startY - 10 > 10 else startY + 10
            cv2.putText(frame, label, (startX, y), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)

# ---- Generar frames con detección ----
def generate_frames():
    while True:
        success, frame = video_capture.read()
        if not success:
            print("Error al leer el frame de la cámara.")
            break

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = detect_faces(gray)
        detections = detect_objects(frame)

        draw_face_boxes(frame, faces)
        draw_object_boxes(frame, detections)

        # Codificar a JPEG
        _, buffer = cv2.imencode('.jpg', frame)
        frame_bytes = buffer.tobytes()

        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

# ---- Endpoint de streaming ----
@camera.get("/video")
def video():
    return StreamingResponse(generate_frames(), media_type="multipart/x-mixed-replace; boundary=frame")

# ---- Cierre de la cámara al apagar ----
@camera.on_event("shutdown")
def shutdown_event():
    video_capture.release()

@camera.get("/open")
def open():
    video_capture = cv2.VideoCapture(0)
    if not video_capture.isOpened():
        raise HTTPException(status_code=500, detail="No se pudo acceder a la cámara")
    else:
        print("Cámara abierta correctamente.")

@camera.get("/close")
def shutdown_event():
    video_capture.release()

# ---- Ejecutar la aplicación ----
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(camera, host="0.0.0.0", port=8000)