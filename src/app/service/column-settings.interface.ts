export interface ColumnSettings {
  field: string;
  title: string;
  width?: number;
  filter?: string;
  format?: string;
  filterable?: boolean;
  orderIndex?: number;
  hidden?: boolean;
}