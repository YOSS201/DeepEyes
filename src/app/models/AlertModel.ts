export interface AlertCreate {
    status: string
    video: string
    video_backup: string
    // video: {
    //     id: string
    // }
    device: {
        id: string
        name: string
        location: string
    }
    
}

export interface AlertResponse {
    id: string
    status: string
    video: string
    video_backup: string
    // video: {
    //     id: string
    //     file_path: string
    //     starts: string
    //     ends: string
    // }
    device: {
        id: string
        name: string
        location: string
    }
    createdAt: string
    updatedAt: string
}