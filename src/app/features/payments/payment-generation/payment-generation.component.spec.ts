import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentGenerationComponent } from './payment-generation.component';

describe('PaymentGenerationComponent', () => {
  let component: PaymentGenerationComponent;
  let fixture: ComponentFixture<PaymentGenerationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaymentGenerationComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PaymentGenerationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
