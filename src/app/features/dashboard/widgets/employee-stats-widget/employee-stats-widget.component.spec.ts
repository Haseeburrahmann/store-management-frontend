import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeStatsWidgetComponent } from './employee-stats-widget.component';

describe('EmployeeStatsWidgetComponent', () => {
  let component: EmployeeStatsWidgetComponent;
  let fixture: ComponentFixture<EmployeeStatsWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeStatsWidgetComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EmployeeStatsWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
