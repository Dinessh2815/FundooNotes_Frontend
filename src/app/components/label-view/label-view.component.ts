import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef, OnDestroy, afterNextRender } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription, filter } from 'rxjs';
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
export class LabelViewComponent implements OnInit, OnDestroy {
  labelId!: number;
  label: Label | null = null;
  notes: Note[] = [];
  userEmail: string | null = null;
  isSidebarExpanded: boolean = true;
  private routeSubscription?: Subscription;
  private navigationSubscription?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private noteService: NoteService,
    private labelService: LabelService,
    private authService: AuthService,
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
        // Then filter by checking which ones have this label
        let checkedCount = 0;
        
        if (allNotes.length === 0) {
          this.cdr.detectChanges();
          return;
        }
        
        allNotes.forEach((note) => {
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
