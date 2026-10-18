import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, switchMap } from 'rxjs';

export interface CloudinaryUploadResponse {
  url: string;
  public_id?: string;
  format?: string;
  width?: number;
  height?: number;
  mock?: boolean;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CloudinaryService {
  private readonly http = inject(HttpClient);

  uploadFile(file: File): Observable<CloudinaryUploadResponse> {
    return from(this.fileToBase64(file)).pipe(
      switchMap(base64 => this.uploadDataUri(base64))
    );
  }

  uploadDataUri(dataUri: string): Observable<CloudinaryUploadResponse> {
    return this.http.post<CloudinaryUploadResponse>('/api/admin/upload', { file: dataUri });
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }
}
