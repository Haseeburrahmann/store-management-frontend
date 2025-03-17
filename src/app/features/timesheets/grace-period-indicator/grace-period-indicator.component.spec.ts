import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GracePeriodIndicatorComponent } from './grace-period-indicator.component';

describe('GracePeriodIndicatorComponent', () => {
  let component: GracePeriodIndicatorComponent;
  let fixture: ComponentFixture<GracePeriodIndicatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GracePeriodIndicatorComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GracePeriodIndicatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
