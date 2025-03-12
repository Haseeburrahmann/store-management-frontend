import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScheduleStatsWidgetComponent } from './schedule-stats-widget.component';

describe('ScheduleStatsWidgetComponent', () => {
  let component: ScheduleStatsWidgetComponent;
  let fixture: ComponentFixture<ScheduleStatsWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScheduleStatsWidgetComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ScheduleStatsWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
