import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HoursDetailComponent } from './hours-detail.component';

describe('HoursDetailComponent', () => {
  let component: HoursDetailComponent;
  let fixture: ComponentFixture<HoursDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HoursDetailComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HoursDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
