import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild, ChangeDetectorRef, CUSTOM_ELEMENTS_SCHEMA, ElementRef } from '@angular/core';
import { KENDO_BUTTONS } from '@progress/kendo-angular-buttons';
import { DataBindingDirective, GridComponent, GridModule, CellClickEvent, ExcelModule } from '@progress/kendo-angular-grid';
import { KENDO_DROPDOWNLIST } from '@progress/kendo-angular-dropdowns';
import { FormGroup, FormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { process } from '@progress/kendo-data-query';

import { InputsModule } from '@progress/kendo-angular-inputs';
import { Data } from '@angular/router';
import { DatabaseService } from '../service/database.service';
import { log } from 'console';

import { StatePersistingService } from '../service/state-persisting.service';
import { GridSettings } from '../service/grid-settings.interface'; // Update the path to the correct location
import { ColumnSettings } from '../service/column-settings.interface';

import { State } from '@progress/kendo-data-query';

@Component({
  selector: 'app-leadheader',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    KENDO_BUTTONS,
    GridModule,
    KENDO_DROPDOWNLIST,
    InputsModule,
    ExcelModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './leadheader.component.html',
  styleUrls: ['./leadheader.component.css'],
})
export class LeadheaderComponent implements OnInit {
  @ViewChild(DataBindingDirective) dataBinding: DataBindingDirective | undefined;
  @ViewChild('gridref', { static: true }) grid!: GridComponent;
  @ViewChild('searchInput') searchInput!: ElementRef;

  public gridSettings: GridSettings = {
    state: {
      skip: 0,
      take: 20,
      sort: [],
      filter: {
        logic: 'and',
        filters: []
      },
      group: []
    },
    gridData: [],
    gridView: [],
    columnsConfig: [],
    columnOrder: []
  };

  public gridData: any[] = [];
  public gridView: any[] = [];
  public mySelection: string[] = [];
  public formGroup: FormGroup | null = null;

  public editModel: any = {};
  private originalData: any[] | undefined;

  isNew: boolean = false;
  editedRowIndex: number | undefined;

  public defaultPreference = { id: '0', name: 'Select Saved Preferences' };
  public savedPreferences: Array<{ id: string, name: string }> = [];

  constructor(
    private cdr: ChangeDetectorRef,
    private http: HttpClient,
    private fb: FormBuilder,
    private databaseService: DatabaseService,
    private statePersistingService: StatePersistingService,
  ) { }

  ngOnInit(): void {
    this.loadEmployees();
    this.loadSavedGridState();
    this.originalData = [...this.gridData];
    this.loadSavedPreferences();
  }

  private loadSavedPreferences(): void {
    const preferences = this.statePersistingService.get('savedPreferences') || [];
    this.savedPreferences = preferences;
  }

  public onPreferenceChange(preference: any): void {
    if (!preference) return;

    if (preference.id === 'new') {
      const name = prompt('Enter a name for your preference:');
      if (name) {
        this.saveNewPreference(name);
      }
    } else {
      const savedPreference = this.statePersistingService.get(`gridSettings_${preference.id}`);
      if (savedPreference) {
        this.gridSettings = this.mapGridSettings(savedPreference);
        this.applyGridSettings();
      }
    }
  }

  public saveNewPreference(name?: string): void {
    if (!this.grid) return;

    const newId = Date.now().toString();
    const gridConfig = {
      state: {
        skip: this.grid.skip || 0,
        take: this.grid.pageSize || 20,
        sort: this.grid.sort || [],
        filter: this.grid.filter || {
          logic: 'and',
          filters: []
        },
        group: this.grid.group || []
      },
      gridData: this.gridData,
      columnsConfig: this.grid.columns.toArray().map((col: any) => ({
        field: col.field,
        title: col.title,
        width: col.width,
        filter: col.filter,
        format: col.format,
        filterable: col.filterable,
        hidden: col.hidden
      }))
    };

    // If name is not provided, prompt the user
    if (!name) {
      const promptResult = prompt('Enter a name for your preference:');
      if (!promptResult) return; // User cancelled
      name = promptResult;
    }

    // Save the new preference configuration
    this.statePersistingService.set(`gridSettings_${newId}`, gridConfig);

    // Update preferences list
    const currentPreferences = this.savedPreferences.filter(p => p.id !== 'new');
    const updatedPreferences = [...currentPreferences, { id: newId, name }];
    this.statePersistingService.set('savedPreferences', updatedPreferences);

    // Reload preferences
    this.loadSavedPreferences();
  }

  private loadEmployees(): void {
    this.databaseService.getLeads()
      .subscribe({
        next: (data) => {
          this.gridData = data;
          this.gridView = this.gridData;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error loading leads:', error);
        }
      });
  }

  onFilterr(inputValue: string): void {
    if (!inputValue) {
      this.gridView = this.originalData ? [...this.originalData] : [];
      return;
    }

    const searchValue = inputValue.toLowerCase().trim();

    const filteredData = this.originalData?.filter(item => {
      return Object.keys(item).some(key => {
        const value = item[key];
        if (value !== null && value !== undefined) {
          return value.toString().toLowerCase().includes(searchValue);
        }
        return false;
      });
    });

    this.gridView = filteredData || [];
  }

  // public onFilter(value: Event): void {
  //   const inputValue = (value.target as HTMLInputElement).value;
  //   this.gridView = process(this.gridData, {
  //     filter: {
  //       logic: "or",
  //       filters: [
  //         { field: "full_name", operator: "contains", value: inputValue },
  //         { field: "job_title", operator: "contains", value: inputValue },
  //         { field: "budget", operator: "contains", value: inputValue },
  //         { field: "phone", operator: "contains", value: inputValue },
  //         { field: "address", operator: "contains", value: inputValue },
  //       ],
  //     },
  //   }).data;

  //   if (this.dataBinding) {
  //     this.dataBinding.skip = 0;
  //   }
  // }

  public exportToExcel(grid: GridComponent): void {
    grid.saveAsExcel();
  }

  public listItems: Array<string> = ["Item 1", "Item 2", "Item 3"];

  isNonIntl = true;
  onToggle(type: 'non' | 'intl') {
    this.isNonIntl = type === 'non';
  }

  data = [
    { text: "View Lead" },
    { text: "Edit Lead" },
    { text: "Assign to Sales Rep" },
    { text: "Schedule Appointment" },
    { text: "Possible Matches" },
    { text: "Tie and Untie Qualified Leads" },
    { text: "Audit Trail" },
    { text: "Estimates" },
    { text: "Lead Documents" },
    { text: "Register With STS" },
    { text: "Survey List" },
    { text: "Duplicate Lead" },
    { text: "Chat" },
  ];

  public cellClickHandler({
    isEdited,
    dataItem,
    rowIndex,
  }: CellClickEvent): void {
    if (isEdited || (this.formGroup && !this.formGroup.valid)) {
      return;
    }

    if (this.isNew) {
      rowIndex += 1;
    }

    this.saveCurrent();

    this.formGroup = this.createFormGroup(dataItem);
    this.editedRowIndex = rowIndex;

    if (this.formGroup) {
      this.grid.editRow(rowIndex, this.formGroup);
    }
  }

  saveCurrent() {
    if (this.formGroup && this.formGroup.valid) {
      const leadData = this.formGroup.value;
      console.log('leadData', leadData);
      if (this.isNew) {
        this.databaseService.createLead(leadData).subscribe({
          next: (response) => {
            this.loadEmployees(); // Refresh grid
            this.closeEditor();
          },
          error: (error) => console.error('Error creating lead:', error)
        });
      } else {
        const id = leadData.id;
        this.databaseService.updateLead(id, leadData).subscribe({
          next: (response) => {
            this.loadEmployees(); // Refresh grid
            this.closeEditor();
          },
          error: (error) => console.error('Error updating lead:', error)
        });
      }
    }
  }
  public saveRow(): void {
    if (this.formGroup && this.formGroup.valid) {
      console.log('formGroup', this.formGroup.value);
      this.saveCurrent();
    }
  }

  public cancelHandler(): void {
    this.closeEditor();
  }

  private closeEditor(): void {
    this.grid.closeRow(this.editedRowIndex);
    this.isNew = false;
    this.editedRowIndex = undefined;
    this.formGroup = null;
  }

  createFormGroup(dataItem: any): FormGroup {
    return this.fb.group({
      id: [dataItem.id],
      record_id: [dataItem.record_id, Validators.required],
      last_name: [dataItem.last_name, Validators.required],
      first_name: [dataItem.first_name, Validators.required],
      email: [dataItem.email, [Validators.required, Validators.email]],
      phone: [dataItem.phone, Validators.required],
      lmp_lead_id: [dataItem.lmp_lead_id, Validators.required],
      appointment_type: [dataItem.appointment_type, Validators.required],
      booking_agency: [dataItem.booking_agency, Validators.required],
      lead_stage: [dataItem.lead_stage, Validators.required],// Make sure to bind this field
      created_source: [dataItem.created_source, Validators.required],// ✅ Added this line
      assign_date: [dataItem.assign_date || null, Validators.required], // ✅ New date field
    });
  }


  public addHandler(): void {
    this.formGroup = this.createFormGroup({
      record_id: '',
      last_name: '',
      first_name: '',
      email: '',
      phone: '',
      lmp_lead_id: '',
      appointment_type: '',
      booking_agency: '',
      lead_stage: '',
      created_source: '',
    });
    this.isNew = true;
    this.grid.addRow(this.formGroup);
  }

  public cellCloseHandler(args: any): void {
    const { formGroup, dataItem, column } = args;

    if (!formGroup.valid) {
      args.preventDefault();
      return;
    }

    const fieldName = column.field;
    const editedValue = formGroup.get(fieldName).value;
    dataItem[fieldName] = editedValue;

    // Update the backend with the edited data (in your case, 'lead_stage')
    this.databaseService.updateLead(dataItem.id, dataItem).subscribe({
      next: () => {
        this.loadEmployees(); // Refresh grid after update
      },
      error: (error) => console.error('Error updating lead:', error),
    });
  }


  public clearFilter(): void {
    // Reset the grid view to original data
    this.gridView = [...this.gridData];

    // Clear the search input if it exists
    const searchInput = document.querySelector('.search-box') as HTMLInputElement;
    if (searchInput) {
      searchInput.value = '';
    }

    // Reset dropdowns to default
    const dropdowns = document.querySelectorAll('kendo-dropdownlist');
    dropdowns.forEach(dropdown => {
      if (dropdown) {
        (dropdown as any).value = undefined;
      }
    });

    //Refresh the grid
    this.grid.data = [...this.gridData];
  }


  private loadSavedGridState(): void {
    const savedState = this.statePersistingService.get('gridSettings');
    if (savedState) {
      this.gridSettings = { ...this.gridSettings, ...savedState };
    }
  }

  // public savePreferences(): void {
  //   if (!this.grid) return;

  //   const columns = this.grid.columns;
  //   const gridConfig = {
  //     state: {
  //       skip: this.grid.skip || 0,
  //       take: this.grid.pageSize || 20,
  //       sort: this.grid.sort || [],
  //       filter: this.grid.filter || null,
  //       group: this.grid.group || []
  //     },
  //     gridData: this.gridData,
  //     columnsConfig: columns.toArray().map((item: any) => ({
  //       field: item.field,
  //       width: item.width,
  //       title: item.title,
  //       filter: item.filter,
  //       format: item.format,
  //       filterable: item.filterable,
  //       orderIndex: item.orderIndex,
  //       hidden: item.hidden
  //     }))
  //   };

  //   this.statePersistingService.set('gridSettings', gridConfig);
  // }


  public dataStateChange(state: State): void {
    if (this.grid) {
      // Update grid settings state
      this.gridSettings.state = {
        skip: state.skip || 0,
        take: state.take || 20,
        sort: state.sort || [],
        filter: state.filter || {
          logic: 'and',
          filters: []
        },
        group: state.group || []
      };

      // Process data with new state
      const processedData = process(this.gridData, state);
      this.gridView = processedData.data;

      // Save current grid configuration
      const gridConfig = {
        state: this.gridSettings.state,
        gridData: this.gridData,
        columnsConfig: this.grid.columns.toArray().map(col => ({
          field: (col as any).field,
          title: col.title,
          width: col.width,
          filterable: (col as any).filterable,
          hidden: col.hidden
        }))
      };

      this.statePersistingService.set('gridSettings', gridConfig);
    }
  }

  private mapGridSettings(savedSettings: any): GridSettings {
    return {
      state: {
        skip: savedSettings.state?.skip || 0,
        take: savedSettings.state?.take || 20,
        sort: savedSettings.state?.sort || [],
        filter: savedSettings.state?.filter || {
          logic: 'and',
          filters: []
        },
        group: savedSettings.state?.group || []
      },
      gridData: this.gridData,
      gridView: [],
      columnsConfig: savedSettings.columnsConfig || [],
      columnOrder: savedSettings.columnOrder || []
    };
  }

  private applyGridSettings(): void {
    if (!this.grid) return;

    // Apply column settings
    const columnsConfig = this.gridSettings.columnsConfig;
    if (columnsConfig && columnsConfig.length > 0) {
      this.grid.columns.toArray().forEach((col: any) => {
        const config = columnsConfig.find(c => c.field === col.field);
        if (config) {
          col.width = config.width;
          col.title = config.title;
          col.filterable = config.filterable;
          col.hidden = config.hidden;
        }
      });
    }

    // Apply state (sorting, filtering, grouping, etc.)
    const processedData = process(this.gridData, this.gridSettings.state);
    this.gridView = processedData.data;

    if (this.dataBinding) {
      this.dataBinding.skip = this.gridSettings.state.skip || 0;
    }
  }

  public onLeadStageChange(dataItem: any): void {
    if (!dataItem.id) return;

    // Call backend to save the lead stage change
    this.databaseService.updateLead(dataItem.id, dataItem).subscribe({
      next: () => {
        console.log('Lead stage updated successfully');
        this.loadEmployees(); // Refresh grid after update
      },
      error: (error) => {
        console.error('Error updating lead stage:', error);
      },
    });
  }

  getLeadStageColor(status: string): string {
    switch (status) {
      case 'New':
        return '#8bc34a'; // green
      case 'Contacted':
        return '#ff6f61'; // red
      case 'Qualified':
        return '#64b5f6'; // blue
      case 'Converted':
        return '#ffd54f'; // yellow
      case 'Lost':
        return '#b0bec5'; // gray
      default:
        return '';
    }
  }



}