import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef, OnDestroy, afterNextRender } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription, filter } from 'rxjs';
import { NoteService } from '../../services/note.service';
import { LabelService } from '../../services/label.service';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { Note } from '../../models/note.model';
import { Label } from '../../models/label.model';
import { HeaderComponent } from '../shared/header/header.component';
import { SidebarComponent } from '../shared/sidebar/sidebar.component';

@Component({
  selector: 'app-label-view',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, SidebarComponent],
  templateUrl: './label-view.component.html',
  styleUrls: ['./label-view.component.scss']
})
export class LabelViewComponent implements OnInit, OnDestroy {
  labelId!: number;
  label: Label | null = null;
  notes: Note[] = [];
  userEmail: string | null = null;
  isSidebarExpanded: boolean = true;
  isDarkMode: boolean = false;
  private routeSubscription?: Subscription;
  private navigationSubscription?: Subscription;

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
    private route: ActivatedRoute,
    private router: Router,
    private noteService: NoteService,
    private labelService: LabelService,
    private authService: AuthService,
    private themeService: ThemeService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Load data AFTER hydration completes (SSR)
    if (isPlatformBrowser(this.platformId)) {
      afterNextRender(() => {
        this.initializeComponent();
      });
    }
  }

  ngOnInit(): void {
    // Component initialization happens in constructor via afterNextRender for SSR
    // Subscribe to theme changes
    this.themeService.darkMode$.subscribe(isDark => {
      const previousMode = this.isDarkMode;
      this.isDarkMode = isDark;
      
      if (previousMode !== isDark && this.labelId) {
        this.loadLabelAndNotes();
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

  initializeComponent(): void {
    // Check authentication first
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    
    this.userEmail = this.authService.getEmail();
    
    // Listen to route param changes
    this.routeSubscription = this.route.params.subscribe(params => {
      const newLabelId = +params['labelId'];
      console.log('Route params changed, labelId:', newLabelId);
      this.labelId = newLabelId;
      this.loadLabelAndNotes();
    });
    
    // Also listen to navigation events to handle same-route navigation
    this.navigationSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        const labelId = +this.route.snapshot.params['labelId'];
        if (labelId && this.labelId !== labelId) {
          this.labelId = labelId;
          this.loadLabelAndNotes();
        }
      });
  }
  
  ngOnDestroy(): void {
    this.routeSubscription?.unsubscribe();
    this.navigationSubscription?.unsubscribe();
  }

  loadLabelAndNotes(): void {
    console.log('Loading label and notes for labelId:', this.labelId);
    
    // Reset notes array
    this.notes = [];
    this.label = null;
    this.cdr.detectChanges();
    
    // Load all labels to find the current one
    this.labelService.getAllLabels().subscribe({
      next: (labels) => {
        this.label = labels.find(l => l.labelId === this.labelId) || null;
        console.log('Found label:', this.label);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading label:', error);
        if (error.status === 401) {
          this.router.navigate(['/login']);
        }
      }
    });

    // Load all notes first
    this.noteService.getAllNotes().subscribe({
      next: (allNotes) => {
        console.log('Loaded all notes:', allNotes.length);
        // Convert colors for display based on current theme
        const notesWithConvertedColors = allNotes.map(note => ({
          ...note,
          color: this.convertColorForDisplay(note.color || '#ffffff')
        }));
        
        // Then filter by checking which ones have this label
        let checkedCount = 0;
        
        if (notesWithConvertedColors.length === 0) {
          this.cdr.detectChanges();
          return;
        }
        
        notesWithConvertedColors.forEach((note) => {
          this.labelService.getNoteLabels(note.noteId).subscribe({
            next: (labels) => {
              checkedCount++;
              const hasLabel = labels.some(l => l.labelId === this.labelId);
              if (hasLabel) {
                this.notes.push(note);
                this.cdr.detectChanges();
              }
              if (checkedCount === allNotes.length) {
                console.log('Filtered notes with label:', this.notes.length);
                this.cdr.detectChanges();
              }
            },
            error: (error) => {
              console.error('Error loading note labels:', error);
              checkedCount++;
            }
          });
        });
      },
      error: (error) => {
        console.error('Error loading notes:', error);
        if (error.status === 401) {
          this.router.navigate(['/login']);
        }
      }
    });
  }

  toggleSidebar(): void {
    this.isSidebarExpanded = !this.isSidebarExpanded;
  }

  deleteNote(note: Note): void {
    this.noteService.deleteNote(note.noteId).subscribe({
      next: () => {
        this.loadLabelAndNotes();
      },
      error: (error) => {
        console.error('Error deleting note:', error);
      }
    });
  }

  archiveNote(note: Note): void {
    this.noteService.updateNote(note.noteId, { isArchived: true }).subscribe({
      next: () => {
        this.loadLabelAndNotes();
      },
      error: (error) => {
        console.error('Error archiving note:', error);
      }
    });
  }

  togglePin(note: Note): void {
    this.noteService.updateNote(note.noteId, { isPinned: !note.isPinned }).subscribe({
      next: () => {
        this.loadLabelAndNotes();
      },
      error: (error) => {
        console.error('Error toggling pin:', error);
      }
    });
  }
}
