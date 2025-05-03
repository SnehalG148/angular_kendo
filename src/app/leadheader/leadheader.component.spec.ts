import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeadheaderComponent } from './leadheader.component';

describe('LeadheaderComponent', () => {
  let component: LeadheaderComponent;
  let fixture: ComponentFixture<LeadheaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeadheaderComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LeadheaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
