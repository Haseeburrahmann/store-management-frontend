import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InventoryRequestListComponent } from './inventory-request-list.component';

describe('InventoryRequestListComponent', () => {
  let component: InventoryRequestListComponent;
  let fixture: ComponentFixture<InventoryRequestListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InventoryRequestListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(InventoryRequestListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
