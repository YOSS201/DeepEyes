import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AlertDetailsComponent } from './alertdetails.component';

describe('AlertDetailsComponent', () => {
  let component: AlertDetailsComponent;
  let fixture: ComponentFixture<AlertDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlertDetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AlertDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
