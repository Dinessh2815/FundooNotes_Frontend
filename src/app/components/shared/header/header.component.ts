import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { LabelService } from '../../../services/label.service';
import { NoteService } from '../../../services/note.service';
import { Label } from '../../../models/label.model';
import { Note } from '../../../models/note.model';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  @Input() userEmail: string | null = null;
  @Input() hasActiveFilter: boolean = false;
  @Output() toggleSidebar = new EventEmitter<void>();
  @Output() searchQuery = new EventEmitter<string>();
  @Output() filterByLabel = new EventEmitter<number>();
  @Output() filterByColor = new EventEmitter<string>();
  @Output() clearFilters = new EventEmitter<void>();

  searchText: string = '';
  showSearchPreview: boolean = false;
  showProfileDropdown: boolean = false;
  labels: Label[] = [];
  filteredNotes: Note[] = [];
  
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

  constructor(
    private authService: AuthService,
    private router: Router,
    private labelService: LabelService,
    private noteService: NoteService
  ) {}

  ngOnInit(): void {
    // Only load labels if user is authenticated
    if (this.userEmail) {
      this.loadLabels();
    }
  }

  loadLabels(): void {
    this.labelService.getAllLabels().subscribe({
      next: (response: Label[]) => {
        this.labels = response;
      },
      error: (error: any) => {
        // Silently fail if not authenticated
        if (error.status !== 401) {
          console.error('Error loading labels:', error);
        }
      }
    });
  }

  onMenuClick(): void {
    this.toggleSidebar.emit();
  }

  onSearchFocus(): void {
    this.showSearchPreview = true;
  }

  onSearchInput(): void {
    if (this.searchText.trim()) {
      this.searchNotes();
    } else {
      this.filteredNotes = [];
    }
  }

  searchNotes(): void {
    this.noteService.getAllNotes().subscribe({
      next: (notes: Note[]) => {
        this.filteredNotes = notes.filter((note: Note) => 
          note.title?.toLowerCase().includes(this.searchText.toLowerCase())
        ).slice(0, 5);
      },
      error: (error: any) => console.error('Error searching notes:', error)
    });
  }

  selectNote(note: Note): void {
    this.searchText = note.title || '';
    this.showSearchPreview = false;
    this.searchQuery.emit(note.title || '');
  }

  selectLabel(labelId: number): void {
    this.searchText = '';
    this.showSearchPreview = false;
    this.filterByLabel.emit(labelId);
  }

  selectColor(color: string): void {
    this.searchText = '';
    this.showSearchPreview = false;
    this.filterByColor.emit(color);
  }

  closeSearch(): void {
    this.searchText = '';
    this.showSearchPreview = false;
    this.filteredNotes = [];
    this.searchQuery.emit('');
  }

  clearAllFilters(): void {
    this.searchText = '';
    this.showSearchPreview = false;
    this.filteredNotes = [];
    this.clearFilters.emit();
  }

  toggleProfileDropdown(): void {
    this.showProfileDropdown = !this.showProfileDropdown;
  }

  refreshPage(): void {
    window.location.reload();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
