export interface ReportCreate {
    alert_ids: string[],
    filters: string,
    user_name: string,
}

export interface ReportResponse {
    id: string,
    alert_ids: string[],
    filters: string,
    user_name: string,
    createdAt: string,
    updatedAt: string
}