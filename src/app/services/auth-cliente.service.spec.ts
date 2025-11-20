import { TestBed } from '@angular/core/testing';

import { AuthClienteService } from './auth-cliente.service';

describe('AuthClienteService', () => {
  let service: AuthClienteService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthClienteService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
