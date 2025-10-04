import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Userpanel } from './userpanel';

describe('Userpanel', () => {
  let component: Userpanel;
  let fixture: ComponentFixture<Userpanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Userpanel]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Userpanel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
