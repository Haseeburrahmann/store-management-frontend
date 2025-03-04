import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClockInOutComponent } from './clock-in-out.component';

describe('ClockInOutComponent', () => {
  let component: ClockInOutComponent;
  let fixture: ComponentFixture<ClockInOutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClockInOutComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ClockInOutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
