import { SortDescriptor, CompositeFilterDescriptor, GroupDescriptor } from "@progress/kendo-data-query";
import { ColumnSettings } from "./column-settings.interface";

export interface GridState {
  skip: number;
  take: number;
  sort: SortDescriptor[];
  filter: CompositeFilterDescriptor;
  group: GroupDescriptor[];
}

export interface GridSettings {
  state: GridState;
  gridData: any[];
  gridView: any[];
  columnsConfig: ColumnSettings[];
  columnOrder: string[];
}
