export interface AlertCreate {
    status: string
    video: {
        id: string
    }
    device: {
        id: string
    }
    
}

export interface AlertResponse {
    id: string
    status: 'pending' | 'confirmed' | 'discarded'
    video: {
        id: string
        file_path: string
        starts: string
        ends: string
    }
    device: {
        id: string
        name: string
        location: string
    }
    createdAt: string
    updatedAt: string
}