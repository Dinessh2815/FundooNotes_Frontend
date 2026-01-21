import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
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
    private noteService: NoteService,
    private labelService: LabelService,
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.userEmail = this.authService.getEmail();
    
    this.route.params.subscribe(params => {
      this.labelId = +params['labelId'];
      this.loadLabelAndNotes();
    });
  }

  loadLabelAndNotes(): void {
    // Load all labels to find the current one
    this.labelService.getAllLabels().subscribe({
      next: (labels) => {
        this.label = labels.find(l => l.labelId === this.labelId) || null;
      },
      error: (error) => {
        console.error('Error loading label:', error);
      }
    });

    // Load all notes and filter by label
    this.noteService.getAllNotes().subscribe({
      next: async (allNotes) => {
        // Filter notes by checking which ones have this label
        const notesWithLabels = await Promise.all(
          allNotes.map(async (note) => {
            const labels = await this.labelService.getNoteLabels(note.noteId).toPromise();
            const hasLabel = labels?.some(l => l.labelId === this.labelId);
            return hasLabel ? note : null;
          })
        );
        
        this.notes = notesWithLabels.filter((note): note is Note => note !== null);
      },
      error: (error) => {
        console.error('Error loading notes:', error);
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
