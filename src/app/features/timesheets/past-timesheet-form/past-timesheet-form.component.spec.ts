import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PastTimesheetFormComponent } from './past-timesheet-form.component';

describe('PastTimesheetFormComponent', () => {
  let component: PastTimesheetFormComponent;
  let fixture: ComponentFixture<PastTimesheetFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PastTimesheetFormComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PastTimesheetFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
