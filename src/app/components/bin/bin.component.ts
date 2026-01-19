import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { NoteService } from '../../services/note.service';
import { AuthService } from '../../services/auth.service';
import { Note } from '../../models/note.model';

@Component({
  selector: 'app-bin',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './bin.component.html',
  styleUrls: ['./bin.component.scss']
})
export class BinComponent implements OnInit {
  deletedNotes: Note[] = [];
  userEmail: string | null = null;

  constructor(
    private noteService: NoteService,
    private authService: AuthService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.userEmail = this.authService.getEmail();
    this.loadDeletedNotes();
  }

  loadDeletedNotes(): void {
    console.log('Loading deleted notes...');
    this.noteService.getDeletedNotes().subscribe({
      next: (notes) => {
        console.log('Deleted notes fetched:', notes);
        console.log('Number of deleted notes:', notes.length);
        this.deletedNotes = notes;
      },
      error: (error) => {
        console.error('Error loading deleted notes:', error);
      }
    });
  }

  restoreNote(note: Note): void {
    this.noteService.restoreNote(note.noteId).subscribe({
      next: (response) => {
        console.log('Note restored:', response);
        this.loadDeletedNotes();
      },
      error: (error) => {
        console.error('Error restoring note:', error);
      }
    });
  }

  permanentDeleteNote(note: Note): void {
    if (confirm('Are you sure you want to permanently delete this note? This action cannot be undone.')) {
      this.noteService.permanentDeleteNote(note.noteId).subscribe({
        next: (response) => {
          console.log('Note permanently deleted:', response);
          this.loadDeletedNotes();
        },
        error: (error) => {
          console.error('Error permanently deleting note:', error);
        }
      });
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
