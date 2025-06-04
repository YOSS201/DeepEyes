import os
import urllib.request

# Ruta donde guardarás los modelos
modelo_dir = r"C:\AngularProyectos\angular_ult\angular_ult\src\modelos"
os.makedirs(modelo_dir, exist_ok=True)

# Rutas locales
prototxt = os.path.join(modelo_dir, "MobileNetSSD_deploy.prototxt")
caffemodel = os.path.join(modelo_dir, "MobileNetSSD_deploy.caffemodel")

# URLs alternativas confiables
url_prototxt = "https://raw.githubusercontent.com/shicai/MobileNet-Caffe/master/MobileNetSSD_deploy.prototxt"
url_caffemodel = "https://github.com/shicai/MobileNet-Caffe/releases/download/v1.0/MobileNetSSD_deploy.caffemodel"

# Descargar
urllib.request.urlretrieve(url_prototxt, prototxt)
urllib.request.urlretrieve(url_caffemodel, caffemodel)

print("✅ Descarga completa.")





