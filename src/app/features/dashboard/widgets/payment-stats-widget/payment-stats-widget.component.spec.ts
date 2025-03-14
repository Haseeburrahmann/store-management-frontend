import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentStatsWidgetComponent } from './payment-stats-widget.component';

describe('PaymentStatsWidgetComponent', () => {
  let component: PaymentStatsWidgetComponent;
  let fixture: ComponentFixture<PaymentStatsWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaymentStatsWidgetComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PaymentStatsWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
