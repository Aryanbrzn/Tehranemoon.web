import { TestBed } from '@angular/core/testing';

import { Httpclient } from './httpclient';

describe('Httpclient', () => {
  let service: Httpclient;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Httpclient);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
