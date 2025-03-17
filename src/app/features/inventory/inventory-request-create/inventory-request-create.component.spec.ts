import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InventoryRequestCreateComponent } from './inventory-request-create.component';

describe('InventoryRequestCreateComponent', () => {
  let component: InventoryRequestCreateComponent;
  let fixture: ComponentFixture<InventoryRequestCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InventoryRequestCreateComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(InventoryRequestCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
