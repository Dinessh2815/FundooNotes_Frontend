import { Component, Input, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LabelService } from '../../../services/label.service';
import { AuthService } from '../../../services/auth.service';
import { Label } from '../../../models/label.model';
import { EditLabelsModalComponent } from '../../edit-labels-modal/edit-labels-modal.component';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, EditLabelsModalComponent],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
  @Input() isExpanded: boolean = true;
  
  labels: Label[] = [];
  showEditLabelsModal: boolean = false;

  constructor(
    private labelService: LabelService,
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    // Only load labels if user is authenticated
    if (this.isAuthenticated()) {
      this.loadLabels();
      this.labelService.labels$.subscribe(labels => {
        this.labels = labels;
      });
    }
  }

  isAuthenticated(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      return this.authService.isLoggedIn();
    }
    return false;
  }

  loadLabels(): void {
    if (!this.isAuthenticated()) {
      return;
    }
    
    this.labelService.getAllLabels().subscribe({
      next: (labels) => {
        this.labels = labels;
      },
      error: (error) => {
        // Silently handle error if user is not authenticated
        if (error.status !== 401) {
          console.error('Error loading labels:', error);
        }
      }
    });
  }

  openEditLabelsModal(): void {
    this.showEditLabelsModal = true;
  }

  closeEditLabelsModal(): void {
    this.showEditLabelsModal = false;
    this.loadLabels();
  }
}
