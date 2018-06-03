import { Component, OnInit, Input, Output, OnChanges, EventEmitter } from '@angular/core';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { FileUploader } from 'ng2-file-upload';
import { WebApiService } from '../../../common/services/web-api.service';
import { InitialDataService } from '../../../common/services/initial-data.service';
import { UpdateDocumentModel } from '../../models/update-document.model';
import { RetrieveDocType } from '../../data/RetrieveDocTypes';
@Component({
    selector: 'rwb-upload-doc',
    templateUrl: './upload-document.component.html',
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
export class UploadDocumentComponent {
    @Input() visible: boolean;
    @Input() programNumber: string;
    @Input() contractGuid: number;
    @Input() uploader: FileUploader;
    @Input("xlerateContractNumbers") xlerateContractNo: number[];

    @Output() visibleChange: EventEmitter<boolean>;
    @Output() onCompleted: EventEmitter<boolean>;
    @Output() onclosed: EventEmitter<boolean>;

    saveDocModel: UpdateDocumentModel;
    Types: any[];
    SubTypes: any[];
    description: string = "";
    errorMessage: string="";



    public hasBaseDropZoneOver: boolean = false;
    public hasAnotherDropZoneOver: boolean = false;

    constructor(private _webapi: WebApiService, private _router: Router, private _init: InitialDataService) {
        this.saveDocModel = new UpdateDocumentModel("", "", "","", "RWB", "", "", "", "", "");
        this.visibleChange = new EventEmitter();
        this.onclosed = new EventEmitter();
        this.onCompleted = new EventEmitter();

        this._router.routeReuseStrategy.shouldReuseRoute = function () {
            return false;
        }
    }

    ngOnInit() {


        this.uploader.onCompleteAll = (): void => {
            this.onCompleted.emit(true);
            this.uploader.clearQueue()
            this.uploader.cancelAll()
        };

        this.getDocumentTypes();
        
    }

    public fileOverBase(e: any): void {
        this.hasBaseDropZoneOver = e;
    }

    public fileOverAnother(e: any): void {
        this.hasAnotherDropZoneOver = e;
    }

    upload = (): void => {
        this.uploader.setOptions({
            additionalParameter: {
                'programNumber': this.programNumber,
                'contractGuid': this.contractGuid,
                // 'description': this.description,
                'description': this.saveDocModel.description,
                'typeId': this.saveDocModel.typeId,
                'subTypeId': this.saveDocModel.subTypeId,
                'xLeRate': this.saveDocModel.xLeRate

            }
        });
        this.uploader.uploadAll();
        this.visible = false;
        this.description = "";
        this.resetControl();
        this.visibleChange.emit(this.visible);
        this.onclosed.emit(true);
    }

    clear()
    {
        this.resetControl();
        this.uploader.clearQueue();
    }

    cancel() {
        this.description = "";
        this.resetControl();
        this.uploader.clearQueue();
        this.uploader.cancelAll()
        this.visible = false;
        this.visibleChange.emit(this.visible);
        this.onclosed.emit(this.visible);
    }

    resetControl() {
        this.saveDocModel = new UpdateDocumentModel("", "", "", "", "", "", "", "", "", "");
        this.setDocumentType("RWB");
        this.setDocumentSubType("N/A");

    }

    getDocumentTypes = (): void => {
       // this.isLoadingData = true;
        // this._webapi.get('/api/Program/RetrieveDocTypes', false).map(res => res.json()).subscribe(
            //(data) => {
                let data = RetrieveDocType;
                if (data) {
                    this.Types = data;
                    if (this.Types)
                    {
                        this.setDocumentType("RWB");
                        this.setDocumentSubType("N/A");
                    }
                   
                }
        //     (err) => {
        //        this.errorMessage = err.text();
        //     },
        //     () => { }
        // );
    }


    setDocumentType = (val): void => {
        let isMatched = false;
        this.saveDocModel.typeDescription = val;
        if (this.Types) {
            for (var d of this.Types) {
                if (d["typeDescription"] === this.saveDocModel.typeDescription) {
                    this.saveDocModel.typeId = d["typeId"]
                    this.SubTypes = d["subTypes"];
                    isMatched = true;
                    break;
                }
            }
        }

        if (!isMatched) {
            this.saveDocModel.typeId = null;
        }
    }

    setDocumentSubType = (val): void => {
        let isMatched = false;
        this.saveDocModel.subTypeDescription = val;
        if (this.SubTypes) {
            for (var d of this.SubTypes) {
                if (d["subTypeDescription"] === this.saveDocModel.subTypeDescription) {
                    this.saveDocModel.subTypeId = d["subTypeId"];
                    isMatched = true;
                    break;
                }
            }
        }
        if (!isMatched) {
            this.saveDocModel.subTypeId = null;
        }
    }

   

    onTypeChange(event) {
        this.setDocumentType(event);
       
    }


    onSubTypeChange(event) {
        this.setDocumentSubType(event);
       
    }









}
