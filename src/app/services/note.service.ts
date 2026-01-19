import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../environments/environment';
import { Note, CreateNoteRequest, UpdateNoteRequest } from '../models/note.model';

@Injectable({
  providedIn: 'root'
})
export class NoteService {
  private apiUrl = `${environment.apiUrl}/notes`;

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

  getAllNotes(): Observable<Note[]> {
    return this.http.get<Note[]>(this.apiUrl, { headers: this.getHeaders() });
  }

  createNote(note: CreateNoteRequest): Observable<any> {
    return this.http.post(this.apiUrl, note, { 
      headers: this.getHeaders(),
      responseType: 'text'
    });
  }

  updateNote(noteId: number, note: UpdateNoteRequest): Observable<any> {
    return this.http.put(`${this.apiUrl}/${noteId}`, note, { 
      headers: this.getHeaders(),
      responseType: 'text'
    });
  }

  deleteNote(noteId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${noteId}`, { 
      headers: this.getHeaders(),
      responseType: 'text'
    });
  }
}
