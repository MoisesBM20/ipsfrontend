import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Bussiness } from './bussiness';

describe('Bussiness', () => {
  let component: Bussiness;
  let fixture: ComponentFixture<Bussiness>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Bussiness]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Bussiness);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
