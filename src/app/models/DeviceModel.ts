export interface DeviceCreate {
  name: string;
  status: boolean;
  position: string;
  type: string;
  model: string;
  location: string;
}

export interface DeviceResponse {
  id: string;
  name: string;
  status: boolean;
  position: string;
  type: string;
  model: string;
  location: string;
  createdAt: string;
  updatedAt: string;
}
