import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StoreStatsWidgetComponent } from './store-stats-widget.component';

describe('StoreStatsWidgetComponent', () => {
  let component: StoreStatsWidgetComponent;
  let fixture: ComponentFixture<StoreStatsWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StoreStatsWidgetComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(StoreStatsWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
