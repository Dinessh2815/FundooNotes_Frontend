export interface Label {
  labelId: number;
  name: string;
  createdAt: Date;
}

export interface CreateLabelRequest {
  name: string;
}

export interface UpdateLabelRequest {
  name: string;
}
