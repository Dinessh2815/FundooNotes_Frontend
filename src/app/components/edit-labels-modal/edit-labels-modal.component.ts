import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LabelService } from '../../services/label.service';
import { Label } from '../../models/label.model';

@Component({
  selector: 'app-edit-labels-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-labels-modal.component.html',
  styleUrls: ['./edit-labels-modal.component.scss']
})
export class EditLabelsModalComponent implements OnInit {
  @Output() close = new EventEmitter<void>();
  
  labels: Label[] = [];
  newLabelName: string = '';
  editingLabelId: number | null = null;
  editingLabelName: string = '';

  constructor(private labelService: LabelService) {}

  ngOnInit(): void {
    // Subscribe to labels observable for real-time updates
    this.labelService.labels$.subscribe(labels => {
      this.labels = labels;
    });
    // Force immediate load
    this.loadLabels();
  }

  loadLabels(): void {
    this.labelService.getAllLabels().subscribe({
      next: (labels) => {
        this.labels = labels;
      },
      error: (error) => {
        console.error('Error loading labels:', error);
      }
    });
  }

  createLabel(): void {
    if (this.newLabelName.trim()) {
      this.labelService.createLabel({ name: this.newLabelName.trim() }).subscribe({
        next: () => {
          this.newLabelName = '';
          this.loadLabels();
        },
        error: (error) => {
          console.error('Error creating label:', error);
        }
      });
    }
  }

  startEditing(label: Label): void {
    this.editingLabelId = label.labelId;
    this.editingLabelName = label.name;
  }

  cancelEditing(): void {
    this.editingLabelId = null;
    this.editingLabelName = '';
  }

  saveLabel(labelId: number): void {
    if (this.editingLabelName.trim()) {
      this.labelService.updateLabel(labelId, { name: this.editingLabelName.trim() }).subscribe({
        next: () => {
          this.editingLabelId = null;
          this.editingLabelName = '';
          this.loadLabels();
        },
        error: (error) => {
          console.error('Error updating label:', error);
        }
      });
    }
  }

  deleteLabel(labelId: number): void {
    if (confirm('Are you sure you want to delete this label?')) {
      this.labelService.deleteLabel(labelId).subscribe({
        next: () => {
          this.loadLabels();
        },
        error: (error) => {
          console.error('Error deleting label:', error);
        }
      });
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.close.emit();
    }
  }

  onClose(): void {
    this.close.emit();
  }
}
