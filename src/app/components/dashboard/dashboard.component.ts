import { Component, OnInit, Inject, PLATFORM_ID, HostListener, ElementRef, ChangeDetectorRef, afterNextRender } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { NoteService } from '../../services/note.service';
import { Note, CreateNoteRequest, UpdateNoteRequest } from '../../models/note.model';
import { HeaderComponent } from '../shared/header/header.component';
import { SidebarComponent } from '../shared/sidebar/sidebar.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, SidebarComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  userEmail: string | null = '';
  notes: Note[] = [];
  pinnedNotes: Note[] = [];
  otherNotes: Note[] = [];
  isSidebarExpanded: boolean = true;
  
  // Color palette - Google Keep colors
  colorPalette = [
    { name: 'Default', value: '#ffffff' },
    { name: 'Red', value: '#f28b82' },
    { name: 'Orange', value: '#fbbc04' },
    { name: 'Yellow', value: '#fff475' },
    { name: 'Green', value: '#ccff90' },
    { name: 'Teal', value: '#a7ffeb' },
    { name: 'Blue', value: '#cbf0f8' },
    { name: 'Dark Blue', value: '#aecbfa' },
    { name: 'Purple', value: '#d7aefb' },
    { name: 'Pink', value: '#fdcfe8' },
    { name: 'Brown', value: '#e6c9a8' },
    { name: 'Gray', value: '#e8eaed' }
  ];
  
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
  showColorPicker: boolean = false;

  constructor(
    private authService: AuthService,
    private noteService: NoteService,
    private router: Router,
    private elementRef: ElementRef,
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef
  ) {
    // Load notes AFTER hydration completes
    if (isPlatformBrowser(this.platformId)) {
      afterNextRender(() => {
        this.loadNotes();
      });
    }
  }

  ngOnInit(): void {
    this.userEmail = this.authService.getEmail();
  }

  loadNotes(): void {
    this.noteService.getAllNotes().subscribe({
      next: (notes) => {
        console.log('Fetched notes:', notes);
        this.notes = [...notes.filter(n => !n.isDeleted && !n.isArchived)];
        this.pinnedNotes = [...this.notes.filter(n => n.isPinned)];
        this.otherNotes = [...this.notes.filter(n => !n.isPinned)];
        console.log('Filtered notes:', { total: this.notes.length, pinned: this.pinnedNotes.length, other: this.otherNotes.length });
        this.cdr.markForCheck();
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
    } else {
      this.isCreateNoteExpanded = false;
      this.resetNewNote();
    }
  }

  createNote(): void {
    if (!this.newNote.title && !this.newNote.description) {
      return;
    }

    console.log('Creating note:', this.newNote);

    this.noteService.createNote(this.newNote).subscribe({
      next: (response) => {
        console.log('Note created successfully:', response);
        this.loadNotes();
        this.resetNewNote();
        this.isCreateNoteExpanded = false;
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
        next: (response) => {
          console.log('Note updated successfully:', response);
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

  closeEditNote(): void {
    if (this.editingNote && (this.editNoteData.title || this.editNoteData.description)) {
      this.saveEditNote();
    } else {
      this.cancelEditNote();
    }
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
    console.log('Deleting note:', note.noteId);
    this.noteService.deleteNote(note.noteId).subscribe({
      next: (response) => {
        console.log('Note deleted successfully:', response);
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

  changeEditNoteColor(color: string): void {
    this.editNoteData.color = color;
    if (this.editingNote) {
      this.editingNote.color = color;
    }
  }

  changeNewNoteColor(color: string): void {
    this.newNote.color = color;
  }

  toggleColorPicker(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.showColorPicker = !this.showColorPicker;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  toggleSidebar(): void {
    this.isSidebarExpanded = !this.isSidebarExpanded;
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    if (this.isCreateNoteExpanded) {
      const createForm = this.elementRef.nativeElement.querySelector('.create-note-form');
      const takeNoteBox = this.elementRef.nativeElement.querySelector('.take-note');
      const clickedInside = createForm?.contains(event.target) || takeNoteBox?.contains(event.target);
      
      if (!clickedInside) {
        this.closeCreateNote();
      }
    }
  }

  onModalOverlayClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (target.classList.contains('modal-overlay')) {
      this.closeEditNote();
    }
  }
}
