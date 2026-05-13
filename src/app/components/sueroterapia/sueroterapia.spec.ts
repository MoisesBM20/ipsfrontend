import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Sueroterapia } from './sueroterapia';

describe('Sueroterapia', () => {
  let component: Sueroterapia;
  let fixture: ComponentFixture<Sueroterapia>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Sueroterapia]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Sueroterapia);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
