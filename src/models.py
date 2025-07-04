from pydantic import BaseModel, Field, EmailStr
from datetime import datetime, time
from typing import Optional
from enum import Enum
from bson.objectid import ObjectId

############### USERS ###################

class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: str

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    role: Optional[str] = None

class UserResponse(UserBase):
    id: str
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True

class UserResponse2(UserBase):
    id: str
    password: str
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True

############### DEVICES ###################

#class DeviceType(str, Enum):
#    CAMERA = "camera"
#    SENSOR = "sensor"
#    ALARM = "alarm"

class DeviceBase(BaseModel):
    name: str
    status: bool
    type: Optional[str]
    model: Optional[str]
    location: Optional[str]

class DeviceCreate(DeviceBase):
    pass

class DeviceUpdate(BaseModel):
    name: str
    status: bool
    type: Optional[str]
    model: Optional[str]
    location: Optional[str]

class DeviceResponse(DeviceBase):
    id: str
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True
        json_encoders = {
            ObjectId: str
        }
######## VIDEO ##########################

class VideoBase(BaseModel):
    file_path: str
    starts: datetime
    ends: datetime

class VideoCreate(VideoBase):
    pass

class VideoUpdate(BaseModel):
    file_path: str
    starts: datetime
    ends: datetime

class VideoResponse(VideoBase):
    id: str
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True
        json_encoders = {
            ObjectId: str
        }


######### ALERTS ##########################################
class AlertStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    DISCARDED = "discarded"

class AlertPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

class AlertType(str, Enum):
    SUSPICION = "suspicion"
    SHOPLIFT = "shoplift"

class DeviceEmbed(BaseModel):
    id: str #= Field(..., alias="_id")
    name: str = Field(..., min_length=1)
    location: Optional[str] = None

class DeviceRef(BaseModel):
    id: str #= Field(..., alias="_id")

class VideoEmbed(BaseModel):
    id: str #= Field(..., alias="_id")
    file_path: str = Field(..., min_length=1)
    starts: datetime
    ends: datetime
    #createdAt: datetime
    #updatedAt: datetime
class VideoRef(BaseModel):
    id: str #= Field(..., alias="_id")

class AlertBase(BaseModel):
    status: AlertStatus
    #priority: AlertPriority
    #alert_type: AlertType
    device: DeviceEmbed
    video: VideoEmbed

class AlertCreate(AlertBase):
    status: AlertStatus
    device: DeviceRef
    video: VideoRef
    #alert_type: AlertType
    #priority: Optional[str] = None


class AlertUpdate(BaseModel):
    status: AlertStatus
    #priority: AlertPriority
    #alert_type: AlertType
    device: DeviceEmbed
    video: VideoEmbed

class AlertResponse(AlertBase):
    id: str
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True
        json_encoders = {
            ObjectId: str
        }


#### CLASE ALERTAS PARA REPORTE #####################################

class Report(BaseModel):
    id: int
    datetime: datetime
    priority: str
    idvideo: int
    idalertype: int
    iddevice: int
    iduser: int
    message: str
    comment: str = ""

class ReportCreate(BaseModel):
    datetime: datetime
    priority: str
    idvideo: int
    idalertype: int
    iddevice: int
    iduser: int
    message: str
    comment: str = ""


    ### Clase TOKENS
# Modelo para el token
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: str | None = None