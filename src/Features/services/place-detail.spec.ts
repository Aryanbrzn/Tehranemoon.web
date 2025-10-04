import { TestBed } from '@angular/core/testing';

import { PlaceDetail } from './place-detail';

describe('PlaceDetail', () => {
  let service: PlaceDetail;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PlaceDetail);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
