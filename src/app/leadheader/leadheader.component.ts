import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild, ChangeDetectorRef, CUSTOM_ELEMENTS_SCHEMA, ElementRef } from '@angular/core';
import { KENDO_BUTTONS } from '@progress/kendo-angular-buttons';
import { DataBindingDirective, GridComponent, GridModule, CellClickEvent, ExcelModule } from '@progress/kendo-angular-grid';
import { KENDO_DROPDOWNLIST } from '@progress/kendo-angular-dropdowns';
import { FormGroup, FormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { process } from '@progress/kendo-data-query';
import { DateInputsModule } from '@progress/kendo-angular-dateinputs';
import { NgbDropdownModule, NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { InputsModule } from '@progress/kendo-angular-inputs';
// import { Data } from '@angular/router';
import { DatabaseService } from '../service/database.service';
// import { log } from 'console';

import { StatePersistingService } from '../service/state-persisting.service';
import { GridSettings } from '../service/grid-settings.interface'; // Update the path to the correct location
// import { ColumnSettings } from '../service/column-settings.interface';

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
    DateInputsModule,
    NgbDropdownModule,
    NgbModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './leadheader.component.html',
  styleUrls: ['./leadheader.component.css'],
})
export class LeadheaderComponent implements OnInit {
  // ViewChild decorators
  @ViewChild(DataBindingDirective) dataBinding: DataBindingDirective | undefined;
  @ViewChild('gridref', { static: true }) grid!: GridComponent;
  @ViewChild('searchInput') searchInput!: ElementRef;
  @ViewChild('preferences') preferences!: any;

  // Constants
  private readonly DATE_FORMAT = 'yyyy-MM-dd';

  // Grid related properties
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
  public editModel: any = {};

  // Form related properties
  public formGroup: FormGroup | null = null;
  isNew: boolean = false;
  editedRowIndex: number | undefined;

  // Preference related properties
  public defaultPreference = { id: '0', name: 'Select Saved Preferences' };
  public savedPreferences: Array<{ id: string, name: string }> = [];

  // List items and data
  public listItems: Array<string> = ["Item 1", "Item 2", "Item 3"];
  isNonIntl = true;

  // Cache and performance related properties
  private originalData: any[] | undefined;
  private debounceTimer: any;
  private memoizedData: { [key: string]: any[] } = {};

  // Action items data
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

  private loadEmployees(): void {
    this.databaseService.getLeads()
      .subscribe({
        next: (data) => {
          // Ensure assign_date is always a valid Date object or null
          this.gridData = data.map(item => ({
            ...item,
            assign_date: item.assign_date ? new Date(item.assign_date.split('T')[0]) : null
          }));
          this.gridView = [...this.gridData];
          this.originalData = [...this.gridData];
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

  public clearFilter(): void {
    if (!this.grid) return;

    // Reset grid to default state without removing saved preferences
    this.gridSettings = {
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
      gridData: this.gridData,
      gridView: [],
      columnsConfig: [],
      columnOrder: []
    };

    // Clear columns ordering and settings
    const defaultColumns = this.grid.columns.toArray();
    defaultColumns.forEach((col, index) => {
      if (col) {
        col.orderIndex = index;
        col.hidden = false;
      }
    });

    // Reset the grid view to original data
    this.gridView = [...this.gridData];

    // Clear the search input if it exists
    const searchInput = document.querySelector('.search-box') as HTMLInputElement;
    if (searchInput) {
      searchInput.value = '';
    }

    // Reset preferences dropdown to default without clearing saved preferences
    const preferencesDropdown = document.querySelector('kendo-dropdownlist[ng-reflect-text-field="name"]') as any;
    if (preferencesDropdown) {
      preferencesDropdown.value = this.defaultPreference;
    }

    // Clear any stored current grid settings
    this.statePersistingService.set('gridSettings', null);

    // Apply default settings
    this.applyGridSettings();
    this.cdr.detectChanges();
  }

  public exportToExcel(grid: GridComponent): void {
    grid.saveAsExcel();
  }

  onToggle(type: 'non' | 'intl') {
    this.isNonIntl = type === 'non';
  }

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
  
  public cellCloseHandler(args: any): void {
    const { formGroup, dataItem, column } = args;

    if (!formGroup.valid) {
      args.preventDefault();
      return;
    }

    const fieldName = column.field;
    let editedValue = formGroup.get(fieldName).value;

    // Handle date formatting for assign_date field
    if (fieldName === 'assign_date' && editedValue) {
      // Convert date to YYYY-MM-DD format
      if (editedValue instanceof Date) {
        editedValue = editedValue.toISOString().split('T')[0];
      }
    }

    dataItem[fieldName] = editedValue;

    // Update the backend with the edited data
    this.databaseService.updateLead(dataItem.id, dataItem).subscribe({
      next: () => {
        this.loadEmployees(); // Refresh grid after update
      },
      error: (error) => console.error('Error updating lead:', error),
    });
  }

  public addHandler(): void {
    const currentDate = new Date();
    const formattedDate = currentDate.toISOString().split('T')[0];
    
    const newLead = {
      record_id: `${Date.now()}`,
      last_name: '',
      first_name: '',
      email: '',
      phone: '',
      lmp_lead_id: Math.floor(Math.random() * 1000) + 1,
      appointment_type: '',
      booking_agency: 0,  // Initialize with 0
      lead_stage: 'New',
      created_source: 'Web',
      assign_date: formattedDate,
      action: 'New Lead'
    };

    // Create form group for new lead with date object for UI
    this.formGroup = this.createFormGroup({...newLead, assign_date: currentDate});
    this.isNew = true;

    // Create the new lead on the server first
    this.databaseService.createLead(newLead).subscribe({
      next: (response) => {
        console.log('New lead created:', response);
        // Update the form with the server-generated ID
        this.formGroup?.patchValue({ id: response.id });
        // Add the new row to the grid and put it in edit mode
        this.grid.addRow(this.formGroup);
        this.editedRowIndex = 0;
        // Refresh the grid to show the new row
        this.loadEmployees();
      },
      error: (error) => {
        console.error('Error creating lead:', error);
        alert('Failed to create new lead. Please try again.');
      }
    });
  }

  saveCurrent() {
    if (this.formGroup && this.formGroup.valid) {
      const leadData = this.formGroup.value;
      console.log('leadData', leadData);
      
      // Format the assign_date properly
      if (leadData.assign_date) {
        leadData.assign_date = leadData.assign_date instanceof Date ? 
          leadData.assign_date.toISOString().split('T')[0] : 
          new Date(leadData.assign_date).toISOString().split('T')[0];
      }

      if (this.isNew) {
        // When creating a new lead, make sure required fields are set
        const newLead = {
          ...leadData,
          action: leadData.action || `Lead ${leadData.first_name || 'New'}`,
          lead_stage: leadData.lead_stage || 'New',
          created_source: leadData.created_source || 'Web',
          record_id: leadData.record_id || `${Date.now()}`,
          lmp_lead_id: leadData.lmp_lead_id || Math.floor(Math.random() * 1000) + 1
        };

        this.databaseService.createLead(newLead).subscribe({
          next: (response) => {
            console.log('New lead created:', response);
            this.loadEmployees(); // Refresh grid
            this.closeEditor();
            this.isNew = false;
          },
          error: (error) => {
            console.error('Error creating lead:', error);
            alert('Failed to create lead. Please try again.');
          }
        });
      } else {
        const id = leadData.id;
        this.databaseService.updateLead(id, leadData).subscribe({
          next: (response) => {
            console.log('Lead updated:', response);
            this.loadEmployees(); // Refresh grid
            this.closeEditor();
          },
          error: (error) => {
            console.error('Error updating lead:', error);
            alert('Failed to update lead. Please try again.');
          }
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
      lead_stage: [dataItem.lead_stage, Validators.required],
      created_source: [dataItem.created_source, Validators.required],
      assign_date: [dataItem.assign_date, Validators.required],
    });
  }

  private loadSavedGridState(): void {
    const savedState = this.statePersistingService.get('gridSettings');
    if (savedState) {
      this.gridSettings = { ...this.gridSettings, ...savedState };
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
      columnsConfig: this.grid.columns.toArray().map(item => ({
        field: (item as any).field,
        title: (item as any).title,
        width: (item as any).width,
        filter: (item as any).filter,
        format: (item as any).format,
        filterable: (item as any).filterable,
        orderIndex: (item as any).orderIndex,
        hidden: (item as any).hidden
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
      console.log('Grid state change:',this.gridSettings.state);
console.log('processedData',processedData);
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

  
  private loadSavedPreferences(): void {
    const preferences = this.statePersistingService.get('savedPreferences') || [];
    this.savedPreferences = preferences;
  }

  public onPreferenceChange(preference: any): void {
    if (!preference) return;

    if (preference.id === 'new') {
      this.saveNewPreference();
    } else {
      const savedPreference = this.statePersistingService.get(`gridSettings_${preference.id}`);
      if (savedPreference) {
        this.gridSettings = this.mapGridSettings(savedPreference);
        this.applyGridSettings();
      }
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
          (col as any).orderIndex = config.orderIndex;
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

    // Create a partial update with just the lead_stage field
    const update = {
      lead_stage: dataItem.lead_stage
    };

    // Call backend to save the lead stage change
    this.databaseService.updateLead(dataItem.id, update).subscribe({
      next: () => {
        console.log('Lead stage updated successfully');
        // Refresh the grid to ensure we have the latest data
        this.loadEmployees();
      },
      error: (error) => {
        console.error('Error updating lead stage:', error);
        // Optionally show an error message to the user
        alert('Failed to update lead stage. Please try again.');
        // Refresh the grid to ensure we're in sync with the server
        this.loadEmployees();
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

  public deletePreference(preferenceId: string, event: Event): void {
    event.stopPropagation(); // Prevent dropdown from opening/closing
    
    if (preferenceId === '0') return; // Don't allow deleting the default preference
    
    if (confirm('Are you sure you want to delete this preference?')) {
      // Remove the preference configuration
      this.statePersistingService.set(`gridSettings_${preferenceId}`, null);
      
      // Update preferences list
      const updatedPreferences = this.savedPreferences.filter(p => p.id !== preferenceId);
      this.statePersistingService.set('savedPreferences', updatedPreferences);
      
      // Reset dropdown to default if the current preference is being deleted
      if (this.preferences?.value?.id === preferenceId) {
        this.preferences.value = this.defaultPreference;
      }
      
      // Reload preferences
      this.loadSavedPreferences();
    }
  }

  public onAssignDateChange(dataItem: any): void {
    if (!dataItem.id) return;

    // Format date for JSON server
    const formattedDate = dataItem.assign_date instanceof Date ? 
      dataItem.assign_date.toISOString().split('T')[0] : 
      new Date(dataItem.assign_date).toISOString().split('T')[0];

    // Update only the assign_date field
    this.databaseService.updateLead(dataItem.id, { assign_date: formattedDate }).subscribe({
      next: () => {
        console.log('Assign date updated successfully');
        this.loadEmployees(); // Refresh grid to ensure we have the latest data
      },
      error: (error) => {
        console.error('Error updating assign date:', error);
        this.loadEmployees(); // Refresh grid to ensure we're in sync with the server
      }
    });
  }

}
