import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Charity } from './charity';

describe('Charity', () => {
  let component: Charity;
  let fixture: ComponentFixture<Charity>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Charity]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Charity);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
