import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { NoteService } from '../../services/note.service';
import { Note, CreateNoteRequest, UpdateNoteRequest } from '../../models/note.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  userEmail: string | null = '';
  notes: Note[] = [];
  pinnedNotes: Note[] = [];
  otherNotes: Note[] = [];
  
  // Create note form
  isCreateNoteExpanded: boolean = false;
  newNote: CreateNoteRequest = {
    title: '',
    description: '',
    color: '#ffffff'
  };
  
  // Edit note
  editingNote: Note | null = null;
  editNoteData: UpdateNoteRequest = {};

  constructor(
    private authService: AuthService,
    private noteService: NoteService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.userEmail = this.authService.getEmail();
    this.loadNotes();
  }

  loadNotes(): void {
    this.noteService.getAllNotes().subscribe({
      next: (notes) => {
        this.notes = notes.filter(n => !n.isDeleted && !n.isArchived);
        this.pinnedNotes = this.notes.filter(n => n.isPinned);
        this.otherNotes = this.notes.filter(n => !n.isPinned);
      },
      error: (error) => {
        console.error('Error loading notes:', error);
      }
    });
  }

  expandCreateNote(): void {
    this.isCreateNoteExpanded = true;
  }

  closeCreateNote(): void {
    if (this.newNote.title || this.newNote.description) {
      this.createNote();
    }
    this.isCreateNoteExpanded = false;
    this.resetNewNote();
  }

  createNote(): void {
    if (!this.newNote.title && !this.newNote.description) {
      return;
    }

    this.noteService.createNote(this.newNote).subscribe({
      next: () => {
        this.loadNotes();
        this.resetNewNote();
      },
      error: (error) => {
        console.error('Error creating note:', error);
      }
    });
  }

  resetNewNote(): void {
    this.newNote = {
      title: '',
      description: '',
      color: '#ffffff'
    };
  }

  startEditNote(note: Note): void {
    this.editingNote = { ...note };
    this.editNoteData = {
      title: note.title,
      description: note.description,
      color: note.color
    };
  }

  saveEditNote(): void {
    if (this.editingNote) {
      this.noteService.updateNote(this.editingNote.noteId, this.editNoteData).subscribe({
        next: () => {
          this.loadNotes();
          this.editingNote = null;
        },
        error: (error) => {
          console.error('Error updating note:', error);
        }
      });
    }
  }

  cancelEditNote(): void {
    this.editingNote = null;
    this.editNoteData = {};
  }

  togglePin(note: Note): void {
    this.noteService.updateNote(note.noteId, { isPinned: !note.isPinned }).subscribe({
      next: () => {
        this.loadNotes();
      },
      error: (error) => {
        console.error('Error toggling pin:', error);
      }
    });
  }

  archiveNote(note: Note): void {
    this.noteService.updateNote(note.noteId, { isArchived: true }).subscribe({
      next: () => {
        this.loadNotes();
      },
      error: (error) => {
        console.error('Error archiving note:', error);
      }
    });
  }

  deleteNote(note: Note): void {
    this.noteService.deleteNote(note.noteId).subscribe({
      next: () => {
        this.loadNotes();
      },
      error: (error) => {
        console.error('Error deleting note:', error);
      }
    });
  }

  changeColor(note: Note, color: string): void {
    this.noteService.updateNote(note.noteId, { color: color }).subscribe({
      next: () => {
        this.loadNotes();
      },
      error: (error) => {
        console.error('Error changing color:', error);
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
