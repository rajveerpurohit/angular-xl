import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TrackingDatepickerComponent } from './tracking-datepicker.component';

describe('DatepickerComponentComponent', () => {
    let component: TrackingDatepickerComponent;
    let fixture: ComponentFixture<TrackingDatepickerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
        declarations: [TrackingDatepickerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
      fixture = TestBed.createComponent(TrackingDatepickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
