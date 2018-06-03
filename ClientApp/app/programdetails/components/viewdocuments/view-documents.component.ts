import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { WebApiService } from '../../../common/services/web-api.service';
import { Headers, Http, Response, URLSearchParams, ResponseContentType } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import { FileUploader } from 'ng2-file-upload';
import 'rxjs/add/operator/startWith';
import 'rxjs/add/operator/map';
import 'rxjs/Rx';

import { InitialDataService } from '../../../common/services/initial-data.service';
import { UpdateDocumentModel } from '../../models/update-document.model';
@Component({
    selector: 'rwb-view-doc',
    templateUrl: './view-documents.component.html',
    styleUrls: ['./view-documents.component.less'],

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
export class ViewDocumentsComponent implements OnInit {
    @Input() visible: boolean;
    @Input() programNumber: string;
    @Output() onShowUploadDocumentEvent = new EventEmitter();
    showUpdateDocumentDialog: boolean;
    @Input() isReadWriteUser: boolean;
    @Input() data: any[];
    @Input() xlerateContractNumbers: number[];
    document: any;
    message: string;
    rowEditStyle: string;


    url: string;
    updateDocumentModel: UpdateDocumentModel;
    updateDocumentModels: UpdateDocumentModel[];
    isUpdateButtonDisabled: boolean = true;
    selectedAll: boolean = false;
    unSelectedAll: boolean = false;
    updateDoc: boolean = true;
    public hasBaseDropZoneOver: boolean = false;
    public hasAnotherDropZoneOver: boolean = false;

    constructor(private _webapi: WebApiService, private _init: InitialDataService) {
        //this.data = documents;
        this.url = this._webapi.getFinalUrl("/api/program/GetDocuments");
        this.updateDocumentModel = new UpdateDocumentModel("", "", "", "", "", "", "", "", "", "");
        this.updateDocumentModels = [];
    }


    ngOnInit() {
    }
    public fileOverBase(e: any): void {
        this.hasBaseDropZoneOver = e;
        this.showUploadDocument();
    }

    public fileOverAnother(e: any): void {
        this.hasAnotherDropZoneOver = e;
    }

    editDocument(document: any) {
        this.checkIfAllSelected();
        this.onUpdateDocCollection(document);
        // this.showUpdateDocumentDialog = true;
        if (this.isValid === false) {
            this.showUpdateDocumentDialog = false;
        }


    }

    showUploadDocument() {
        this.onShowUploadDocumentEvent.emit();
    }


    onUpdateDocumentClosed(isShowUpdateDocument: boolean): void {

        this.showUpdateDocumentDialog = isShowUpdateDocument;
    }

    onUpdateDocumentCompleted(docs: any): void {
        //update on the collection
        docs.forEach((doc, index) => {
            this.data.forEach((element, index) => {

                if (element.documentGuid === doc.documentGuid) {

                    element.type = doc.typeDescription;
                    element.subType = doc.subTypeDescription;
                    element.xLeRate = doc.xLeRate;
                    element.shortDescription = doc.description;
                }
            });
        });
    }

    onUpdateDocCollection(document: any) {
        this.updateDocumentModel = new UpdateDocumentModel("", "", "", "", "", "", "", "", "", "");
        this.updateDocumentModel.isrowselected = document.isRowSelected;
        this.updateDocumentModel.programNum = document.programRef;
        this.updateDocumentModel.documentID = document.documentID;
        this.updateDocumentModel.documentGuid = document.documentGuid;

        this.updateDocumentModel.typeDescription = document.type;
        this.updateDocumentModel.subTypeDescription = document.subType;

        if (document.xLeRate === undefined || document.xLeRate === null) {
            this.updateDocumentModel.xLeRate = "";
        }
        else {
            this.updateDocumentModel.xLeRate = document.xLeRate;
        }
        this.updateDocumentModel.ownerType = document.ownerType;
        this.updateDocumentModel.description = document.shortDescription;



        if (this.updateDocumentModel.isrowselected === true) {            
            this.updateDocumentModels.push(this.updateDocumentModel);
        }
        else {
            if (this.updateDocumentModels) {
                var index = this.updateDocumentModels.map((d) => d.documentID).indexOf(this.updateDocumentModel.documentID);
                let rowIndex = this.updateDocumentModels.findIndex(u => u.documentID === this.updateDocumentModel.documentID);
                // remove(1)  at  index position
                this.updateDocumentModels.splice(rowIndex, 1);

            }
        }
    }

    launchUpdateDocPopup() {
        if (this.updateDocumentModels) {
            if (this.updateDocumentModels.length > 0) {
                this.updateDoc = false;
                this.showUpdateDocumentDialog = true;
            }

        }
        else {
            this.showUpdateDocumentDialog = false;
        }

    }

    get isValid(): boolean {
        if (this.updateDocumentModels) {
            return this.updateDocumentModels.length > 0;
        }
        else {
            return false;
        }
    }


    selectAll() {
        if (this.data) {
            this.updateDocumentModels = [];
            for (var d of this.data) {
                d["isRowSelected"] = this.selectedAll;

                if (this.selectedAll) {
                    this.onUpdateDocCollection(d);
                }

            }
        }
    }
    private checkIfAllSelected() {
        this.selectedAll = this.data.every(function (item: any) {
            return item.isRowSelected == true;
        });

        this.unSelectedAll = this.data.every(function (item: any) {
            return item.isRowSelected == false;
        });
    }
    onUpdateDocumentClose(event) {
        this.updateDoc = true;
    }
}
