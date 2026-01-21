import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../environments/environment';
import { Label, CreateLabelRequest, UpdateLabelRequest } from '../models/label.model';

@Injectable({
  providedIn: 'root'
})
export class LabelService {
  private apiUrl = `${environment.apiUrl}/labels`;
  private labelsSubject = new BehaviorSubject<Label[]>([]);
  public labels$ = this.labelsSubject.asObservable();

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('auth_token');
      if (token) {
        headers = headers.set('Authorization', `Bearer ${token}`);
      }
    }

    return headers;
  }

  getAllLabels(): Observable<Label[]> {
    return this.http.get<Label[]>(this.apiUrl, { headers: this.getHeaders() })
      .pipe(
        tap(labels => this.labelsSubject.next(labels))
      );
  }

  createLabel(label: CreateLabelRequest): Observable<any> {
    return this.http.post(this.apiUrl, label, { 
      headers: this.getHeaders(),
      responseType: 'text'
    }).pipe(
      tap(() => this.getAllLabels().subscribe())
    );
  }

  updateLabel(labelId: number, label: UpdateLabelRequest): Observable<any> {
    return this.http.put(`${this.apiUrl}/${labelId}`, label, { 
      headers: this.getHeaders(),
      responseType: 'text'
    }).pipe(
      tap(() => this.getAllLabels().subscribe())
    );
  }

  deleteLabel(labelId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${labelId}`, { 
      headers: this.getHeaders(),
      responseType: 'text'
    }).pipe(
      tap(() => this.getAllLabels().subscribe())
    );
  }

  // Note Label operations
  addLabelToNote(noteId: number, labelId: number): Observable<any> {
    return this.http.post(`${environment.apiUrl}/notes/${noteId}/labels/${labelId}`, {}, { 
      headers: this.getHeaders(),
      responseType: 'text'
    });
  }

  removeLabelFromNote(noteId: number, labelId: number): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/notes/${noteId}/labels/${labelId}`, { 
      headers: this.getHeaders(),
      responseType: 'text'
    });
  }

  getNoteLabels(noteId: number): Observable<Label[]> {
    return this.http.get<Label[]>(`${environment.apiUrl}/notes/${noteId}/labels`, { 
      headers: this.getHeaders()
    });
  }
}
