import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SalesStatsWidgetComponent } from './sales-stats-widget.component';

describe('SalesStatsWidgetComponent', () => {
  let component: SalesStatsWidgetComponent;
  let fixture: ComponentFixture<SalesStatsWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SalesStatsWidgetComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SalesStatsWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
