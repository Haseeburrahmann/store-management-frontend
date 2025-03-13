import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminStatsWidgetComponent } from './admin-stats-widget.component';

describe('AdminStatsWidgetComponent', () => {
  let component: AdminStatsWidgetComponent;
  let fixture: ComponentFixture<AdminStatsWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminStatsWidgetComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AdminStatsWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
