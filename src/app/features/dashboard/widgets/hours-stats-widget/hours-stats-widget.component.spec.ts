import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HoursStatsWidgetComponent } from './hours-stats-widget.component';

describe('HoursStatsWidgetComponent', () => {
  let component: HoursStatsWidgetComponent;
  let fixture: ComponentFixture<HoursStatsWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HoursStatsWidgetComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HoursStatsWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
