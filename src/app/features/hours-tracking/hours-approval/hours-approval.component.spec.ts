import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HoursApprovalComponent } from './hours-approval.component';

describe('HoursApprovalComponent', () => {
  let component: HoursApprovalComponent;
  let fixture: ComponentFixture<HoursApprovalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HoursApprovalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HoursApprovalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
