export interface Note {
  noteId: number;
  title: string;
  description: string;
  color: string;
  isPinned: boolean;
  isArchived: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export interface CreateNoteRequest {
  title: string;
  description: string;
  color?: string;
  isPinned?: boolean;
  isArchived?: boolean;
}

export interface UpdateNoteRequest {
  title?: string;
  description?: string;
  color?: string;
  isPinned?: boolean;
  isArchived?: boolean;
}
