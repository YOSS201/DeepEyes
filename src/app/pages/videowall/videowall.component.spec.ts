import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VideowallComponent } from './videowall.component';

describe('VideowallComponent', () => {
  let component: VideowallComponent;
  let fixture: ComponentFixture<VideowallComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VideowallComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VideowallComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
