import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { WebApiService } from '../../../common/services/web-api.service';

@Component({
    selector: 'rwb-view-clearance-report',
    templateUrl: './view-clearance-report.component.html',
    styleUrls: ['./view-clearance-report.component.less'],
    animations: [
        trigger('dialog', [
            transition('void => *', [
                style({ transform: 'scale3d(.3, .3, .3)' }),
                animate(100)
            ]),
            transition('* => void', [
                animate(100, style({ transform: 'scale3d(.0, .0, .0)' }))
            ])
        ])
    ]
})
export class ViewClearanceReportsComponent implements OnInit {
    @Input() visible: boolean;
    @Input() data = [];
    @Output() onViewReportClosedEvent = new EventEmitter<boolean>();

    url: string;
    constructor(private _webapi: WebApiService) {
        this.url = this._webapi.getFinalUrl("/api/program/GetDocuments");
    }

    ngOnInit() {
    }

    close() {
        this.visible = false;
        this.onViewReportClosedEvent.emit(this.visible);
    }
}
