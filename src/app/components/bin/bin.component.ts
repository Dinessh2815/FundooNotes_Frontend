import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef, afterNextRender } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { NoteService } from '../../services/note.service';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { Note } from '../../models/note.model';
import { HeaderComponent } from '../shared/header/header.component';
import { SidebarComponent } from '../shared/sidebar/sidebar.component';

@Component({
  selector: 'app-bin',
  standalone: true,
  imports: [CommonModule, HeaderComponent, SidebarComponent],
  templateUrl: './bin.component.html',
  styleUrls: ['./bin.component.scss']
})
export class BinComponent implements OnInit {
  deletedNotes: Note[] = [];
  userEmail: string | null = null;
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
    private noteService: NoteService,
    private authService: AuthService,
    private themeService: ThemeService,
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
    
    // Subscribe to theme changes
    this.themeService.darkMode$.subscribe(isDark => {
      const previousMode = this.isDarkMode;
      this.isDarkMode = isDark;
      
      if (previousMode !== isDark) {
        this.loadDeletedNotes();
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

  loadDeletedNotes(): void {
    this.noteService.getDeletedNotes().subscribe({
      next: (notes) => {
        const convertedNotes = notes.map(note => ({
          ...note,
          color: this.convertColorForDisplay(note.color || '#ffffff')
        }));
        this.deletedNotes = [...convertedNotes];
        this.cdr.markForCheck();
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

  toggleSidebar(): void {
    this.isSidebarExpanded = !this.isSidebarExpanded;
  }
}
