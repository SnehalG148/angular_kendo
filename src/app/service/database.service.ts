import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface LeadData {
  id: string;
  action: string;
  record_id: string;
  last_name: string;
  first_name: string;
  email: string;
  phone: string;
  lmp_lead_id: number;
  appointment_type: string;
  booking_agency: number;
  lead_stage: string;
  created_source: string;
  assign_date: string;
}

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  private apiUrl = 'http://localhost:3000/emp';

  constructor(private http: HttpClient) { }

  // Get all leads
  getLeads(): Observable<LeadData[]> {
    return this.http.get<LeadData[]>(this.apiUrl);
  }

  // Get a single lead by ID
  getLead(id: string): Observable<LeadData> {
    return this.http.get<LeadData>(`${this.apiUrl}/${id}`);
  }

  // Create a new lead
  createLead(lead: Omit<LeadData, 'id'>): Observable<LeadData> {
    return this.http.post<LeadData>(this.apiUrl, lead);
  }

  // Update a lead
  updateLead(id: string, lead: Partial<LeadData>): Observable<LeadData> {
    return this.http.patch<LeadData>(`${this.apiUrl}/${id}`, lead);
  }

  // Delete a lead
  deleteLead(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Search leads
  searchLeads(query: string): Observable<LeadData[]> {
    return this.http.get<LeadData[]>(`${this.apiUrl}?q=${query}`);
  }

  // Filter leads by appointment type
  filterByAppointmentType(type: string): Observable<LeadData[]> {
    return this.http.get<LeadData[]>(`${this.apiUrl}?appointment_type=${type}`);
  }

  // Get leads by booking agency
  getLeadsByAgency(agencyId: number): Observable<LeadData[]> {
    return this.http.get<LeadData[]>(`${this.apiUrl}?booking_agency=${agencyId}`);
  }
}




