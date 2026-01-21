import { Component, OnInit, Input, Output, EventEmitter, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LabelService } from '../../services/label.service';
import { Label } from '../../models/label.model';

@Component({
  selector: 'app-label-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './label-picker.component.html',
  styleUrls: ['./label-picker.component.scss']
})
export class LabelPickerComponent implements OnInit {
  @Input() noteId!: number;
  @Input() attachedLabelIds: number[] = [];
  @Input() showInfoMessage: boolean = false;
  @Output() close = new EventEmitter<void>();
  @Output() labelsChanged = new EventEmitter<void>();
  @Output() dismissInfoMessage = new EventEmitter<void>();
  
  allLabels: Label[] = [];
  newLabelName: string = '';

  constructor(
    private labelService: LabelService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.loadLabels();
  }

  loadLabels(): void {
    this.labelService.getAllLabels().subscribe({
      next: (labels) => {
        this.allLabels = labels;
      },
      error: (error) => {
        console.error('Error loading labels:', error);
      }
    });
  }

  isLabelAttached(labelId: number): boolean {
    return this.attachedLabelIds.includes(labelId);
  }

  toggleLabel(label: Label, event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    
    if (checkbox.checked) {
      this.labelService.addLabelToNote(this.noteId, label.labelId).subscribe({
        next: () => {
          this.attachedLabelIds.push(label.labelId);
          this.labelsChanged.emit();
        },
        error: (error) => {
          console.error('Error adding label:', error);
          checkbox.checked = false;
        }
      });
    } else {
      this.labelService.removeLabelFromNote(this.noteId, label.labelId).subscribe({
        next: () => {
          const index = this.attachedLabelIds.indexOf(label.labelId);
          if (index > -1) {
            this.attachedLabelIds.splice(index, 1);
          }
          this.labelsChanged.emit();
        },
        error: (error) => {
          console.error('Error removing label:', error);
          checkbox.checked = true;
        }
      });
    }
  }

  createAndAttachLabel(): void {
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

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('label-picker-backdrop')) {
      this.close.emit();
    }
  }

  onGotItClick(): void {
    this.dismissInfoMessage.emit();
  }
}
