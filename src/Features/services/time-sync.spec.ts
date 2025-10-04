import { TestBed } from '@angular/core/testing';

import { TimeSync } from './time-sync';

describe('TimeSync', () => {
  let service: TimeSync;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TimeSync);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
