import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NewSubmissionComponent } from './newsubmission.component';

describe('NewSubmissionComponent', () => {
    let component: NewSubmissionComponent;
    let fixture: ComponentFixture<NewSubmissionComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [NewSubmissionComponent]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(NewSubmissionComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should be created', () => {
        expect(component).toBeTruthy();
    });
});
