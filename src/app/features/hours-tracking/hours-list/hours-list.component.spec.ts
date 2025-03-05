import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HoursListComponent } from './hours-list.component';

describe('HoursListComponent', () => {
  let component: HoursListComponent;
  let fixture: ComponentFixture<HoursListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HoursListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HoursListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
