import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef, afterNextRender } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NoteService } from '../../services/note.service';
import { Note } from '../../models/note.model';
import { HeaderComponent } from '../shared/header/header.component';
import { SidebarComponent } from '../shared/sidebar/sidebar.component';

@Component({
  selector: 'app-archive',
  standalone: true,
  imports: [CommonModule, HeaderComponent, SidebarComponent],
  templateUrl: './archive.component.html',
  styleUrls: ['./archive.component.scss']
})
export class ArchiveComponent implements OnInit {
  userEmail: string | null = '';
  archivedNotes: Note[] = [];
  isSidebarExpanded: boolean = true;

  constructor(
    private authService: AuthService,
    private noteService: NoteService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef
  ) {
    if (isPlatformBrowser(this.platformId)) {
      afterNextRender(() => {
        this.loadArchivedNotes();
      });
    }
  }

  ngOnInit(): void {
    this.userEmail = this.authService.getEmail();
  }

  loadArchivedNotes(): void {
    this.noteService.getAllNotes().subscribe({
      next: (notes) => {
        this.archivedNotes = [...notes.filter(n => n.isArchived && !n.isDeleted)];
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error loading archived notes:', error);
      }
    });
  }

  unarchiveNote(note: Note): void {
    this.noteService.updateNote(note.noteId, { 
      title: note.title,
      description: note.description,
      color: note.color,
      isArchived: false 
    }).subscribe({
      next: () => {
        this.loadArchivedNotes();
      },
      error: (error) => {
        console.error('Error unarchiving note:', error);
      }
    });
  }

  deleteNote(note: Note): void {
    this.noteService.deleteNote(note.noteId).subscribe({
      next: () => {
        this.loadArchivedNotes();
      },
      error: (error) => {
        console.error('Error deleting note:', error);
      }
    });
  }

  toggleSidebar(): void {
    this.isSidebarExpanded = !this.isSidebarExpanded;
  }
}
