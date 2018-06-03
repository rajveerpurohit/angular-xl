import { Component, OnInit, Input, Output, EventEmitter, OnChanges, HostListener } from '@angular/core';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { WebApiService } from '../../../common/services/web-api.service';
import { Headers, Response, URLSearchParams, ResponseContentType } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/startWith';
import 'rxjs/add/operator/map';
import 'rxjs/Rx';
import { DocumentTypes } from '../../models/data-documenttypes';
import { BlockUIService } from '../../../common/services/block-ui.service';
import { UpdateDocumentModel } from '../../models/update-document.model';
import { RetrieveDocType } from '../../data/RetrieveDocTypes';
@Component({
    selector: 'rwb-update-doc',
    templateUrl: './update-documents.component.html',
    styleUrls: ['./update-documents.component.less'],
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
export class UpdateDocumentsComponent implements OnInit, OnChanges {

    message: string;
    errorMessage: string;
    @Input() visible: boolean;
    @Input() programNumber: string;
    @Input() updateDocList: UpdateDocumentModel[];
    @Input("xlerateContractNumbers") xlerateContractNo: number[];

    @Output() onUpdateDocumentClosedEvent = new EventEmitter<boolean>();
    @Output() onUpdateDocumentClose = new EventEmitter<boolean>();
    @Output() onUpdateDocumentCompleted = new EventEmitter<any>();

    updateDoc: UpdateDocumentModel;
    Types: any[];
    SubTypes: any[];

    isLoadingData = false;
    isButtonDisabled = true;
    isxLeRateDisabled = false;


    constructor(private _webapi: WebApiService, private _blockUI: BlockUIService) {

    }

    //constructor() {
    //    ///  this.Types= DocumentTypes;
    //}

    ngOnInit() {
        this.getDocumentTypes();
    }

    ngOnChanges() {
        this.isButtonDisabled = true;
    }

    @HostListener('document:click', ['$event'])
    clickout(event) {
        //// if (event.target.id === 'btnDocEdit') {
        if (event.target.id === 'btnUpdateClassification' || event.target.id === 'chkSelectAll' || event.target.id === 'chkSelectOne') {
            if (this.visible) {
                this.updateDoc = new UpdateDocumentModel("", "", "", "", "N/A", "", "N/A", "", "", "");
                this.isButtonDisabled = false;
                if (this.updateDocList) {
                    if (this.updateDocList.length === 1) {
                        this.updateDoc = this.updateDocList[0];
                    }
                }

                if (this.isLoadingData) {
                    this._blockUI.show();
                    setTimeout(() => {
                        this._blockUI.hide();
                        this.setDocumentType(this.updateDoc.typeDescription);
                        this.setDocumentSubType(this.updateDoc.subTypeDescription);
                    }, 2000);
                }
                else {
                    this.visible = true;
                    this.setDocumentType(this.updateDoc.typeDescription);
                    this.setDocumentSubType(this.updateDoc.subTypeDescription);
                }

                if (this.updateDocList.find(doc => doc.ownerType === "SubmissionBO")) {
                    this.isxLeRateDisabled = true;
                }
            }
        }
    }

    getDocumentTypes = (): void => {
        this.isLoadingData = true;
        let data = RetrieveDocType;
        // this._webapi.get('/api/Program/RetrieveDocTypes', false).map(res => res.json()).subscribe(
        // this._http.get(url).map((res:Response) => res.json()).subscribe( 
        //(data) => {
        if (data) {
            this.Types = data;
            this.Types = DocumentTypes;
            this.isLoadingData = false;
            this._blockUI.hide();
        }
    }


    cancel() {
        this.updateDoc = new UpdateDocumentModel("", "", "", "", "", "", "", "", "", "");
        this.visible = false;
        this.message = "";
        this.errorMessage = "";
        this.onUpdateDocumentClose.emit();
        this.onUpdateDocumentClosedEvent.emit(this.visible);
    }

    onTypeChange(event) {
        this.setDocumentType(event);
        this.setButtonDisable();
    }


    onSubTypeChange(event) {
        this.setDocumentSubType(event);
        this.setButtonDisable();
    }

    setDocumentType = (val): void => {
        let isMatched = false;
        this.updateDoc.typeDescription = val;
        if (this.Types) {
            for (var d of this.Types) {
                if (d["typeDescription"] === this.updateDoc.typeDescription) {
                    this.updateDoc.typeId = d["typeId"]
                    this.SubTypes = d["subTypes"];
                    isMatched = true;
                    break;
                }
            }
        }

        if (!isMatched) {
            this.updateDoc.typeId = null;
        }
    }

    setDocumentSubType = (val): void => {
        let isMatched = false;
        this.updateDoc.subTypeDescription = val;
        if (this.SubTypes) {
            for (var d of this.SubTypes) {
                if (d["subTypeDescription"] === this.updateDoc.subTypeDescription) {
                    this.updateDoc.subTypeId = d["subTypeId"];
                    isMatched = true;
                    break;
                }
            }
        }
        if (!isMatched) {
            this.updateDoc.subTypeId = null;
        }
    }


    setButtonDisable = (): void => {
        this.isButtonDisabled = false;
    }

    updateDocument() {
        if (this.updateDoc.typeId == undefined || this.updateDoc.typeId == null || this.updateDoc.typeId.length == 0) {
            this.errorMessage = "Please select types";
        }
        else if (this.updateDoc.subTypeId == undefined || this.updateDoc.subTypeId == null || this.updateDoc.subTypeId.length == 0) {
            this.errorMessage = "Please select SubType";
        }
        else {
            if (!this.updateDoc.xLeRate) {
                this.updateDoc.xLeRate = "";
            }

            this.updateDocList.forEach((documentRow, index) => {
                documentRow.typeId = this.updateDoc.typeId;
                documentRow.typeDescription = this.updateDoc.typeDescription;
                documentRow.subTypeId = this.updateDoc.subTypeId;
                documentRow.subTypeDescription = this.updateDoc.subTypeDescription;
                documentRow.xLeRate = this.updateDoc.xLeRate;
                documentRow.description = this.updateDoc.description;
            });

            let url = '/api/Program/UpdateDocument';

            //this.message = "Document is updated successfully";
            //this.onUpdateDocumentCompleted.emit(this.updateDocList);
            //this.cancel();


            this._webapi.post(url, this.updateDocList)
                .map(resp => resp.json()).subscribe(
                (data) => {
                    this.message = "Document is updated successfully";
                    this.onUpdateDocumentCompleted.emit(this.updateDocList);
                    this.cancel();
                },
                (error) => {
                    console.log(error);
                    this.errorMessage = "Redoc service error occured";
                });
        }
    }

    onShowMessageClick = (): void => {
        this.message = "";
        this.errorMessage = "";
    }
}



//import { Component, OnInit, Input, Output, EventEmitter, OnChanges, HostListener } from '@angular/core';
//import { trigger, state, style, animate, transition } from '@angular/animations';
//import { WebApiService } from '../../common/services/web-api.service';
//import { Headers, Http, Response, URLSearchParams, ResponseContentType } from '@angular/http';
//import { Observable } from 'rxjs/Observable';
//import 'rxjs/add/operator/startWith';
//import 'rxjs/add/operator/map';
//import 'rxjs/Rx';

//import { BlockUIService } from '../../common/services/block-ui.service';
//import { UpdateDocumentModel } from '../models/update-document.model';
//@Component({
//    selector: 'rwb-update-doc',
//    templateUrl: './update-documents.component.html',
//    styleUrls: ['./view-documents.component.less'],
//    animations: [
//        trigger('dialog', [
//            transition('void => *', [
//                style({ transform: 'scale3d(.3, .3, .3)' }),
//                animate(100)
//            ]),
//            transition('* => void', [
//                animate(100, style({ transform: 'scale3d(.0, .0, .0)' }))
//            ])
//        ])
//    ]
//})
//export class UpdateDocumentsComponent implements OnInit, OnChanges {

//    message: string;
//    errorMessage: string;
//    @Input() visible: boolean;
//    @Input() programNumber: string;    
//    @Input() updateDocList: UpdateDocumentModel[];
//    @Input("xlerateContractNumbers") xlerateContractNo: number[];

//    @Output() onUpdateDocumentClosedEvent = new EventEmitter<boolean>();
//    @Output() onUpdateDocumentCompleted = new EventEmitter<any>();

//    updateDoc: UpdateDocumentModel;
//    Types: any[];
//    SubTypes: any[];

//    isLoadingData = false;
//    isButtonDisabled = true;


//    constructor(private _webapi: WebApiService, private _blockUI: BlockUIService) {

//    }

//    ngOnInit() {
//        this.getDocumentTypes();
//    }

//    ngOnChanges() {
//        this.isButtonDisabled = true;
//    }

//    @HostListener('document:click', ['$event'])
//    clickout(event) {
//       //// if (event.target.id === 'btnDocEdit') {
//        if (event.target.id === 'btnUpdateClassification') {
//            this.updateDoc = new UpdateDocumentModel("", "", "", "", "N/A", "", "N/A", "", "", "");
//            this.isButtonDisabled = false;
//            if (this.updateDocList) {
//                if (this.updateDocList.length === 1) {
//                    this.updateDoc = this.updateDocList[0];
//                }
//            }

//            if (this.isLoadingData) {
//                this._blockUI.show();
//                setTimeout(() => {
//                    this._blockUI.hide();
//                    this.setDocumentType(this.updateDoc.typeDescription);
//                    this.setDocumentSubType(this.updateDoc.subTypeDescription);
//                }, 2000);
//            }
//            else {
//                this.setDocumentType(this.updateDoc.typeDescription);
//                this.setDocumentSubType(this.updateDoc.subTypeDescription);
//            }
//        }
//    }

//    getDocumentTypes = (): void => {
//        this.isLoadingData = true;
//        this._webapi.get('/api/Program/RetrieveDocTypes', false).map(res => res.json()).subscribe(
//            (data) => {
//                if (data) {
//                    this.Types = data;
//                    this.isLoadingData = false;
//                    this._blockUI.hide();
//                }
//            },
//            (err) => {
//                this.errorMessage = err.text();
//            },
//            () => { }
//        );
//    }


//    cancel() {
//        this.updateDoc = new UpdateDocumentModel("", "", "", "", "", "", "", "", "", "");
//        this.visible = false;
//        this.message = "";
//        this.errorMessage = "";
//        this.onUpdateDocumentClosedEvent.emit(this.visible);
//    }

//    onTypeChange(event) {
//        this.setDocumentType(event);
//        this.setButtonDisable();
//    }


//    onSubTypeChange(event) {
//        this.setDocumentSubType(event);
//        this.setButtonDisable();
//    }

//    setDocumentType = (val): void => {
//        let isMatched = false;
//        this.updateDoc.typeDescription = val;
//        if (this.Types) {
//            for (var d of this.Types) {
//                if (d["typeDescription"] === this.updateDoc.typeDescription) {
//                    this.updateDoc.typeId = d["typeId"]
//                    this.SubTypes = d["subTypes"];
//                    isMatched = true;
//                    break;
//                }
//            }
//        }

//        if (!isMatched) {
//            this.updateDoc.typeId = null;
//        }
//    }

//    setDocumentSubType = (val): void => {
//        let isMatched = false;
//        this.updateDoc.subTypeDescription = val;
//        if (this.SubTypes) {
//            for (var d of this.SubTypes) {
//                if (d["subTypeDescription"] === this.updateDoc.subTypeDescription) {
//                    this.updateDoc.subTypeId = d["subTypeId"];
//                    isMatched = true;
//                    break;
//                }
//            }
//        }
//        if (!isMatched) {
//            this.updateDoc.subTypeId = null;
//        }
//    }


//    setButtonDisable = (): void => {
//        this.isButtonDisabled = false;
//    }

//    updateDocument() {
//        if (this.updateDoc.typeId == undefined || this.updateDoc.typeId == null || this.updateDoc.typeId.length == 0) {
//            this.errorMessage = "Please select types";
//        }
//        else if (this.updateDoc.subTypeId == undefined || this.updateDoc.subTypeId == null || this.updateDoc.subTypeId.length == 0) {
//            this.errorMessage = "Please select SubType";
//        }
//        else {
//            if (!this.updateDoc.xLeRate) {
//                this.updateDoc.xLeRate = "";
//            }

//            this.updateDocList.forEach((documentRow, index) => {
//                documentRow.typeId = this.updateDoc.typeId;
//                documentRow.typeDescription = this.updateDoc.typeDescription;
//                documentRow.subTypeId = this.updateDoc.subTypeId;
//                documentRow.subTypeDescription = this.updateDoc.subTypeDescription;
//                documentRow.xLeRate = this.updateDoc.xLeRate;
//                documentRow.description = this.updateDoc.description;
//            });

//            let url = '/api/Program/UpdateDocument';

//            this._webapi.post(url, this.updateDocList)
//                .map(resp => resp.json()).subscribe(
//                (data) => {
//                    //this.message = "Document is updated successfully";
//                    this.onUpdateDocumentCompleted.emit(this.updateDocList);
//                    this.cancel();
//                },
//                (error) => {
//                    console.log(error);
//                    this.errorMessage = "Redoc service error occured";
//                });
//        }
//    }

//    onShowMessageClick = (): void => {
//        this.message = "";
//        this.errorMessage = "";
//    }
//}
