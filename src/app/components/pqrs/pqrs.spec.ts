import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Pqrs } from './pqrs';

describe('Pqrs', () => {
  let component: Pqrs;
  let fixture: ComponentFixture<Pqrs>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Pqrs]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Pqrs);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
