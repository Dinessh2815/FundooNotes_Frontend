import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NoteService } from '../../services/note.service';
import { LabelService } from '../../services/label.service';
import { AuthService } from '../../services/auth.service';
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
export class LabelViewComponent implements OnInit {
  labelId!: number;
  label: Label | null = null;
  notes: Note[] = [];
  userEmail: string | null = null;
  isSidebarExpanded: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private noteService: NoteService,
    private labelService: LabelService,
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    // Check authentication first
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    
    this.userEmail = this.authService.getEmail();
    
    this.route.params.subscribe(params => {
      const newLabelId = +params['labelId'];
      // Only reload if the labelId actually changed
      if (this.labelId !== newLabelId) {
        this.labelId = newLabelId;
        this.loadLabelAndNotes();
      }
    });
  }

  loadLabelAndNotes(): void {
    console.log('Loading label and notes for labelId:', this.labelId);
    
    // Load all labels to find the current one
    this.labelService.getAllLabels().subscribe({
      next: (labels) => {
        this.label = labels.find(l => l.labelId === this.labelId) || null;
        console.log('Found label:', this.label);
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
        // Then filter by checking which ones have this label
        this.notes = [];
        let checkedCount = 0;
        
        if (allNotes.length === 0) {
          return;
        }
        
        allNotes.forEach((note) => {
          this.labelService.getNoteLabels(note.noteId).subscribe({
            next: (labels) => {
              checkedCount++;
              const hasLabel = labels.some(l => l.labelId === this.labelId);
              if (hasLabel) {
                this.notes.push(note);
              }
              if (checkedCount === allNotes.length) {
                console.log('Filtered notes with label:', this.notes.length);
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
