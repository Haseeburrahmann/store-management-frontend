import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllTimesheetsComponent } from './all-timesheets.component';

describe('AllTimesheetsComponent', () => {
  let component: AllTimesheetsComponent;
  let fixture: ComponentFixture<AllTimesheetsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllTimesheetsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AllTimesheetsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
