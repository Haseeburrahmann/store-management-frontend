import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TimesheetStatsWidgetComponent } from './timesheet-stats-widget.component';

describe('TimesheetStatsWidgetComponent', () => {
  let component: TimesheetStatsWidgetComponent;
  let fixture: ComponentFixture<TimesheetStatsWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimesheetStatsWidgetComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TimesheetStatsWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
