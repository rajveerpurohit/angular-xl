import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProgramDetailsComponent } from './program-details.component';

describe('HomeComponent', () => {
    let component: ProgramDetailsComponent;
    let fixture: ComponentFixture<ProgramDetailsComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [ProgramDetailsComponent]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ProgramDetailsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should be created', () => {
        expect(component).toBeTruthy();
    });
});
