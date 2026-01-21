import { Component, OnInit, Inject, PLATFORM_ID, HostListener, ElementRef, ChangeDetectorRef, afterNextRender } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { NoteService } from '../../services/note.service';
import { LabelService } from '../../services/label.service';
import { ThemeService } from '../../services/theme.service';
import { Note, CreateNoteRequest, UpdateNoteRequest } from '../../models/note.model';
import { Label } from '../../models/label.model';
import { HeaderComponent } from '../shared/header/header.component';
import { SidebarComponent } from '../shared/sidebar/sidebar.component';
import { LabelPickerComponent } from '../label-picker/label-picker.component';
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, SidebarComponent, LabelPickerComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  userEmail: string | null = '';
  notes: Note[] = [];
  pinnedNotes: Note[] = [];
  otherNotes: Note[] = [];
  isSidebarExpanded: boolean = true;
  isDarkMode: boolean = false;
  
  // Color palette - Google Keep colors
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

  get colorPalette() {
    return this.isDarkMode ? this.darkColorPalette : this.lightColorPalette;
  }

  // Color mapping methods
  convertColorToTheme(color: string, toDarkMode: boolean): string {
    const sourceArray = toDarkMode ? this.lightColorPalette : this.darkColorPalette;
    const targetArray = toDarkMode ? this.darkColorPalette : this.lightColorPalette;
    
    const index = sourceArray.findIndex(c => c.value.toLowerCase() === color.toLowerCase());
    if (index !== -1 && targetArray[index]) {
      return targetArray[index].value;
    }
    return color; // Return original if not found
  }

  // Convert color for display based on current theme
  convertColorForDisplay(color: string): string {
    // If in dark mode, check if color is a light color and convert it
    if (this.isDarkMode) {
      const lightIndex = this.lightColorPalette.findIndex(c => c.value.toLowerCase() === color.toLowerCase());
      if (lightIndex !== -1 && this.darkColorPalette[lightIndex]) {
        return this.darkColorPalette[lightIndex].value;
      }
    } else {
      // If in light mode, check if color is a dark color and convert it
      const darkIndex = this.darkColorPalette.findIndex(c => c.value.toLowerCase() === color.toLowerCase());
      if (darkIndex !== -1 && this.lightColorPalette[darkIndex]) {
        return this.lightColorPalette[darkIndex].value;
      }
    }
    return color;
  }

  // Convert color back to storage format (always store in light mode format)
  convertColorForStorage(displayColor: string): string {
    if (this.isDarkMode) {
      // Convert dark color back to light equivalent for storage
      const darkIndex = this.darkColorPalette.findIndex(c => c.value.toLowerCase() === displayColor.toLowerCase());
      if (darkIndex !== -1 && this.lightColorPalette[darkIndex]) {
        return this.lightColorPalette[darkIndex].value;
      }
    }
    return displayColor;
  }

  convertAllNotesColors(toDarkMode: boolean): void {
    // Just reload notes to apply new theme colors
    this.loadNotes();
  }
  
  // Create note form
  isCreateNoteExpanded: boolean = false;
  newNote: CreateNoteRequest = {
    title: '',
    description: '',
    color: '#ffffff',
    isPinned: false
  };
  
  // Edit note
  editingNote: Note | null = null;
  editNoteData: UpdateNoteRequest = {};
  showColorPicker: boolean = false;
  
  // Label picker
  showLabelPicker: boolean = false;
  labelPickerNoteId: number | null = null;
  labelPickerPosition: { top: string, left: string } = { top: '0', left: '0' };
  noteLabels: Map<number, Label[]> = new Map();
  showLabelInfoMessage: boolean = false;
  
  // Filtering
  allNotes: Note[] = [];
  searchFilter: string = '';
  labelFilter: number | null = null;
  colorFilter: string | null = null;

  constructor(
    private authService: AuthService,
    private noteService: NoteService,
    private labelService: LabelService,
    private themeService: ThemeService,
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
    this.checkLabelInfoMessageStatus();
    
    // Subscribe to theme changes
    this.themeService.darkMode$.subscribe(isDark => {
      const previousMode = this.isDarkMode;
      this.isDarkMode = isDark;
      
      // Convert colors only if theme actually changed
      if (previousMode !== isDark) {
        this.convertAllNotesColors(isDark);
      }
      
      this.cdr.detectChanges();
    });
  }

  checkLabelInfoMessageStatus(): void {
    if (isPlatformBrowser(this.platformId)) {
      const hasSeenMessage = localStorage.getItem('hasSeenLabelInfoMessage');
      this.showLabelInfoMessage = !hasSeenMessage;
    }
  }

  dismissLabelInfoMessage(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('hasSeenLabelInfoMessage', 'true');
      this.showLabelInfoMessage = false;
    }
  }

  loadNotes(): void {
    this.noteService.getAllNotes().subscribe({
      next: (notes) => {
        console.log('Fetched notes:', notes);
        
        // Convert colors based on current theme
        const convertedNotes = notes.map(note => ({
          ...note,
          color: this.convertColorForDisplay(note.color || '#ffffff')
        }));
        
        this.allNotes = [...convertedNotes.filter(n => !n.isDeleted && !n.isArchived)];
        this.applyFilters();
        
        // Load labels for all notes
        this.allNotes.forEach(note => this.loadNoteLabels(note.noteId));
        
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error loading notes:', error);
      }
    });
  }

  applyFilters(): void {
    let filteredNotes = [...this.allNotes];

    // Apply search filter
    if (this.searchFilter) {
      filteredNotes = filteredNotes.filter(note => 
        note.title?.toLowerCase().includes(this.searchFilter.toLowerCase())
      );
    }

    // Apply label filter
    if (this.labelFilter !== null) {
      filteredNotes = filteredNotes.filter(note => {
        const noteLabels = this.noteLabels.get(note.noteId) || [];
        return noteLabels.some(label => label.labelId === this.labelFilter);
      });
    }

    // Apply color filter
    if (this.colorFilter) {
      filteredNotes = filteredNotes.filter(note => note.color === this.colorFilter);
    }

    this.notes = filteredNotes;
    this.pinnedNotes = filteredNotes.filter(n => n.isPinned);
    this.otherNotes = filteredNotes.filter(n => !n.isPinned);
    
    console.log('Filtered notes:', { 
      total: this.notes.length, 
      pinned: this.pinnedNotes.length, 
      other: this.otherNotes.length,
      filters: { search: this.searchFilter, label: this.labelFilter, color: this.colorFilter }
    });
  }

  onSearchQuery(query: string): void {
    this.searchFilter = query;
    this.labelFilter = null;
    this.colorFilter = null;
    this.applyFilters();
  }

  onFilterByLabel(labelId: number): void {
    this.labelFilter = labelId;
    this.searchFilter = '';
    this.colorFilter = null;
    this.applyFilters();
  }

  onFilterByColor(color: string): void {
    this.colorFilter = color;
    this.searchFilter = '';
    this.labelFilter = null;
    this.applyFilters();
  }

  onClearFilters(): void {
    this.searchFilter = '';
    this.labelFilter = null;
    this.colorFilter = null;
    this.applyFilters();
  }

  hasActiveFilter(): boolean {
    return !!(this.searchFilter || this.labelFilter !== null || this.colorFilter);
  }

  loadNoteLabels(noteId: number): void {
    this.labelService.getNoteLabels(noteId).subscribe({
      next: (labels) => {
        this.noteLabels.set(noteId, labels);
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error loading note labels:', error);
      }
    });
  }

  getNoteLabels(noteId: number): Label[] {
    return this.noteLabels.get(noteId) || [];
  }

  openLabelPicker(note: Note, event: MouseEvent): void {
    event.stopPropagation();
    const button = event.currentTarget as HTMLElement;
    const rect = button.getBoundingClientRect();
    
    this.labelPickerPosition = {
      top: `${rect.bottom}px`,
      left: `${rect.left}px`
    };
    
    this.labelPickerNoteId = note.noteId;
    this.showLabelPicker = true;
  }

  openLabelPickerForNewNote(event: MouseEvent): void {
    event.stopPropagation();
    // For new note, we'll just show the info message but won't actually assign labels
    // until the note is created. User can add labels after creating the note.
    alert('Please create the note first, then you can add labels to it.');
  }

  closeLabelPicker(): void {
    this.showLabelPicker = false;
    this.labelPickerNoteId = null;
  }

  onLabelsChanged(): void {
    if (this.labelPickerNoteId) {
      this.loadNoteLabels(this.labelPickerNoteId);
    }
  }

  removeLabelFromNote(noteId: number, labelId: number): void {
    this.labelService.removeLabelFromNote(noteId, labelId).subscribe({
      next: () => {
        this.loadNoteLabels(noteId);
      },
      error: (error) => {
        console.error('Error removing label from note:', error);
      }
    });
  }

  getAttachedLabelIds(noteId: number): number[] {
    const labels = this.noteLabels.get(noteId) || [];
    return labels.map(l => l.labelId);
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

    // Convert color to storage format before saving
    const noteToCreate = {
      ...this.newNote,
      color: this.convertColorForStorage(this.newNote.color || '#ffffff')
    };

    this.noteService.createNote(noteToCreate).subscribe({
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
      color: this.isDarkMode ? this.darkColorPalette[0].value : this.lightColorPalette[0].value,
      isPinned: false
    };
  }

  toggleNewNotePin(): void {
    this.newNote.isPinned = !this.newNote.isPinned;
  }

  archiveNewNote(): void {
    if (!this.newNote.title && !this.newNote.description) {
      return;
    }

    const noteWithArchive: CreateNoteRequest = {
      ...this.newNote,
      color: this.convertColorForStorage(this.newNote.color || '#ffffff'),
      isArchived: true
    };

    this.noteService.createNote(noteWithArchive).subscribe({
      next: (response) => {
        console.log('Note archived successfully:', response);
        this.loadNotes();
        this.resetNewNote();
        this.isCreateNoteExpanded = false;
      },
      error: (error) => {
        console.error('Error archiving note:', error);
      }
    });
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
      // Convert color to storage format before saving
      const dataToSave = {
        ...this.editNoteData,
        color: this.editNoteData.color ? this.convertColorForStorage(this.editNoteData.color) : undefined
      };
      
      this.noteService.updateNote(this.editingNote.noteId, dataToSave).subscribe({
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
    console.log('Toggling pin for note:', note.noteId, 'Current isPinned:', note.isPinned, 'New value:', !note.isPinned);
    
    // Update UI immediately for instant feedback
    const newPinState = !note.isPinned;
    note.isPinned = newPinState;
    this.cdr.markForCheck();
    
    const updateData: UpdateNoteRequest = {
      title: note.title,
      description: note.description,
      color: note.color,
      isPinned: newPinState
    };
    this.noteService.updateNote(note.noteId, updateData).subscribe({
      next: () => {
        console.log('Pin toggled successfully');
        this.loadNotes();
      },
      error: (error) => {
        console.error('Error toggling pin:', error);
        console.error('Error details:', error.error);
        console.error('Status:', error.status);
        // Revert on error
        note.isPinned = !newPinState;
        this.cdr.markForCheck();
      }
    });
  }

  archiveNote(note: Note): void {
    this.noteService.updateNote(note.noteId, { 
      title: note.title,
      description: note.description,
      color: note.color,
      isArchived: true 
    }).subscribe({
      next: () => {
        if (this.editingNote?.noteId === note.noteId) {
          this.editingNote = null;
        }
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
        if (this.editingNote?.noteId === note.noteId) {
          this.editingNote = null;
        }
        this.loadNotes();
      },
      error: (error) => {
        console.error('Error deleting note:', error);
      }
    });
  }

  changeColor(note: Note, color: string): void {
    this.showColorPicker = false;
    const updateData: UpdateNoteRequest = {
      title: note.title,
      description: note.description,
      color: this.convertColorForStorage(color)
    };
    this.noteService.updateNote(note.noteId, updateData).subscribe({
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
    // Close color picker when clicking outside
    if (this.showColorPicker) {
      const colorPicker = this.elementRef.nativeElement.querySelector('.color-picker-dropdown');
      const colorBtn = this.elementRef.nativeElement.querySelector('.color-btn');
      const clickedInside = colorPicker?.contains(event.target) || colorBtn?.contains(event.target);
      
      if (!clickedInside) {
        this.showColorPicker = false;
      }
    }
    
    // Close create note form when clicking outside
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
