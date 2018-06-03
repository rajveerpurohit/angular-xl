import { Component, OnInit, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { WebApiService } from '../../common/services/web-api.service';
import { Headers, Http, Response, URLSearchParams, ResponseContentType } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/startWith';
import 'rxjs/add/operator/map';
import 'rxjs/Rx';


@Component({
    selector: 'rwb-dialog',
    templateUrl: './dialog.component.html',
    styleUrls: ['./dialog.component.less'],

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
export class DialogComponent implements OnInit {
    @Input() visible: boolean;    
    @Input() programNumber: string;
    //@Input() contractNumber: string;
    @Output() onViewDocumentClosedEvent = new EventEmitter<boolean>();

    @Input() viewDoc = [];
    //_visible = false;
    //@Input()
    //set visible(val) {
    //    this._visible = val;
    //    if (val) {
    //        this.viewDocuments();
    //    }
    //}
    //get visible() {
    //    return this._visible;
    //}

    //private _versionNumber: number = -1;
    //programTitle: any;
    //currentCtr: any;
    //currentVersion: any;

    constructor(private _webapi: WebApiService) { }

    ngOnInit() {
        
    }

    //viewDocuments = (): void => {
    //    var url = '/api/program/ReDocDocuments?programNum=' + this.programNumber + '&contractGuid=' + this.contractNumber;
    //    this._webapi.get(url).map(res => res.json()).subscribe(
    //        (data) => {
    //            this.viewDoc = data;
    //        },
    //        (err) => console.log(err)
    //    );
    //}


    getDocuments = (documentId: string): void => {
        var url = '/api/program/GetDocuments?argDocumentID=' + documentId;
        this._webapi.get(url).map(res => res.blob()).subscribe(
            (data) => {
                this.downloadFile(data);
            },
            (err) => console.log(err)
        );
    }

    downloadFile(data: Response) {
        var blob = new Blob([data], { type: 'text/csv' });
        var url = window.URL.createObjectURL(blob);
        window.open(url);
    }

    close() {
        this.visible = false;
        this.onViewDocumentClosedEvent.emit(this.visible);
    }
}
