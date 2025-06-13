import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {

  private sockets: {[key: string]: WebSocket} = {};
  private messageSubjects: {[key: string]: Subject<Blob>} = {};

  constructor() { }

  connect(url: string, cameraId: string): void {
    // Cerrar conexión existente si la hay
    if (this.sockets[cameraId]) {
      this.disconnect(cameraId);
    }

    this.sockets[cameraId] = new WebSocket(url);
    this.messageSubjects[cameraId] = new Subject<Blob>();

    this.sockets[cameraId].onmessage = (event) => {
      if (event.data instanceof Blob) {
        this.messageSubjects[cameraId].next(event.data);
      } else {
        // Convertir ArrayBuffer a Blob si es necesario
        const blob = new Blob([event.data], { type: 'image/jpeg' });
        this.messageSubjects[cameraId].next(blob);
      }
    };

    this.sockets[cameraId].onerror = (error) => {
      console.error(`WebSocket error (${cameraId}):`, error);
      this.messageSubjects[cameraId].error(error);
    };

    this.sockets[cameraId].onclose = (event) => {
      console.log(`WebSocket closed (${cameraId}):`, event);
      this.messageSubjects[cameraId].complete();
      delete this.sockets[cameraId];
      delete this.messageSubjects[cameraId];
    };
  }

  getMessages(cameraId: string): Observable<Blob> {
    return this.messageSubjects[cameraId].asObservable();
  }

  disconnect(cameraId: string): void {
    if (this.sockets[cameraId]) {
      this.sockets[cameraId].close();
    }
  }

}
