import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef, afterNextRender } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NoteService } from '../../services/note.service';
import { ThemeService } from '../../services/theme.service';
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
  isDarkMode: boolean = false;

  lightColorPalette = [
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

  darkColorPalette = [
    { name: 'Default', value: '#202124' },
    { name: 'Dark Red', value: '#5c2b29' },
    { name: 'Dark Orange', value: '#614a19' },
    { name: 'Dark Yellow', value: '#635d19' },
    { name: 'Dark Green', value: '#345920' },
    { name: 'Dark Teal', value: '#16504b' },
    { name: 'Dark Blue', value: '#2d555e' },
    { name: 'Dark Navy', value: '#1e3a5f' },
    { name: 'Dark Purple', value: '#42275e' },
    { name: 'Dark Pink', value: '#5b2245' },
    { name: 'Dark Brown', value: '#442f19' },
    { name: 'Dark Gray', value: '#3c3f43' }
  ];

  constructor(
    private authService: AuthService,
    private noteService: NoteService,
    private themeService: ThemeService,
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
    
    // Subscribe to theme changes
    this.themeService.darkMode$.subscribe(isDark => {
      const previousMode = this.isDarkMode;
      this.isDarkMode = isDark;
      
      if (previousMode !== isDark) {
        this.loadArchivedNotes();
      }
      
      this.cdr.detectChanges();
    });
  }

  convertColorForDisplay(color: string): string {
    if (this.isDarkMode) {
      const lightIndex = this.lightColorPalette.findIndex(c => c.value.toLowerCase() === color.toLowerCase());
      if (lightIndex !== -1 && this.darkColorPalette[lightIndex]) {
        return this.darkColorPalette[lightIndex].value;
      }
    } else {
      const darkIndex = this.darkColorPalette.findIndex(c => c.value.toLowerCase() === color.toLowerCase());
      if (darkIndex !== -1 && this.lightColorPalette[darkIndex]) {
        return this.lightColorPalette[darkIndex].value;
      }
    }
    return color;
  }

  convertColorForStorage(displayColor: string): string {
    if (this.isDarkMode) {
      const darkIndex = this.darkColorPalette.findIndex(c => c.value.toLowerCase() === displayColor.toLowerCase());
      if (darkIndex !== -1 && this.lightColorPalette[darkIndex]) {
        return this.lightColorPalette[darkIndex].value;
      }
    }
    return displayColor;
  }

  loadArchivedNotes(): void {
    this.noteService.getAllNotes().subscribe({
      next: (notes) => {
        const filtered = notes.filter(n => n.isArchived && !n.isDeleted);
        const convertedNotes = filtered.map(note => ({
          ...note,
          color: this.convertColorForDisplay(note.color || '#ffffff')
        }));
        this.archivedNotes = [...convertedNotes];
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
      color: this.convertColorForStorage(note.color || '#ffffff'),
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
