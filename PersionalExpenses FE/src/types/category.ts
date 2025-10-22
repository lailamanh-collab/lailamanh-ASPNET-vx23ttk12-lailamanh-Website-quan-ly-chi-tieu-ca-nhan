export interface Category {
  id: number;
  name: string;
  type: number; // 0 income, 1 expense (assumption)
  parentId: number | null;
  color: string; // hex color like #00e5e9
  icon: string; // emoji or icon string
  isActive: boolean;
  isDefault: boolean;
}

export interface CreateCategoryRequest {
  name: string;
  type: number;
  parentId?: number | null;
  color?: string;
  icon?: string;
}

export interface UpdateCategoryRequest extends Partial<CreateCategoryRequest> {}
