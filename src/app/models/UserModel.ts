export interface UserCreate {
    name: string,
    email: string,
    role: string,
    password: string
}

export interface UserResponse{
    name: string,
    email: string,
    role: string,
    id: string,
    createdAt: string,
    updatedAt: string
}

export interface UserModelContra{
    name: string,
    email: string,
    password: string,
    role: string,
    id: string,
    createdAt: string,
    updatedAt: string
}