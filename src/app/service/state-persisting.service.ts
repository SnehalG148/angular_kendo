// state-persisting.service.ts
import { Injectable } from '@angular/core';
import { SortDescriptor, CompositeFilterDescriptor, GroupDescriptor } from '@progress/kendo-data-query';
import { ColumnSettings } from './column-settings.interface';

@Injectable({
  providedIn: 'root',
})
export class StatePersistingService {
  saveGridState(p0: { state: { skip: number; take: number; sort: SortDescriptor[]; filter: CompositeFilterDescriptor | null; group: GroupDescriptor[]; }; columnOrder: string[]; }, gridData: any[], gridView: any[], gridConfig: { state: { skip: number; take: number; sort: SortDescriptor[]; filter: CompositeFilterDescriptor | null; group: GroupDescriptor[]; }; gridData: any[]; columnsConfig: ColumnSettings[]; }, p1: { field: any; title: string; width: number; filter: any; filterable: any; hidden: boolean; }[]) {
    throw new Error('Method not implemented.');
  }
  get(key: string): any {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : null;
  }

  set(key: string, value: any): void {
    localStorage.setItem(key, JSON.stringify(value));
  }
}
