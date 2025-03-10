import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PendingApprovalsWidgetComponent } from './pending-approvals-widget.component';

describe('PendingApprovalsWidgetComponent', () => {
  let component: PendingApprovalsWidgetComponent;
  let fixture: ComponentFixture<PendingApprovalsWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PendingApprovalsWidgetComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PendingApprovalsWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
