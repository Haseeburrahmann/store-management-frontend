import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InventoryRequestDetailComponent } from './inventory-request-detail.component';

describe('InventoryRequestDetailComponent', () => {
  let component: InventoryRequestDetailComponent;
  let fixture: ComponentFixture<InventoryRequestDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InventoryRequestDetailComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(InventoryRequestDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
