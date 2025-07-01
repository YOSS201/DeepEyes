export interface ConfigResponse {
    id: string
    user_id: string
    auto: boolean
    sonido: string
    notif: boolean
    volumen: number
    deteccion: number
    createdAt: string
    updatedAt: string
}

export interface ConfigCreate {
    user_id: string
    auto: boolean
    sonido: string
    notif: boolean
    volumen: number
    deteccion: number
}