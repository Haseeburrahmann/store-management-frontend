import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HoursDashboardComponent } from './hours-dashboard.component';

describe('HoursDashboardComponent', () => {
  let component: HoursDashboardComponent;
  let fixture: ComponentFixture<HoursDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HoursDashboardComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HoursDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
