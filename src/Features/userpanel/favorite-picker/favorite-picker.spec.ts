import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FavoritePicker } from './favorite-picker';

describe('FavoritePicker', () => {
  let component: FavoritePicker;
  let fixture: ComponentFixture<FavoritePicker>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FavoritePicker]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FavoritePicker);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
