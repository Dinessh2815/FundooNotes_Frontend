import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef, afterNextRender } from '@angular/core';
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
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Load notes AFTER hydration completes
    if (isPlatformBrowser(this.platformId)) {
      afterNextRender(() => {
        this.loadDeletedNotes();
      });
    }
  }

  ngOnInit(): void {
    this.userEmail = this.authService.getEmail();
  }

  loadDeletedNotes(): void {
    this.noteService.getDeletedNotes().subscribe({
      next: (notes) => {
        this.deletedNotes = [...notes]; // Create new array reference
        this.cdr.markForCheck(); // Mark for check instead of detectChanges
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
