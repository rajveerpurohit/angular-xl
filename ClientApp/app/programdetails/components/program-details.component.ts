import { Component, OnInit, Input, Injectable } from '@angular/core';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { Headers, RequestOptions } from '@angular/http';
import { FileUploader } from 'ng2-file-upload';
import { WebApiService } from '../../common/services/web-api.service';
import { FoolproofControlService } from "../../common/services/foolproof-control.service";
import { InitialDataService } from '../../common/services/initial-data.service';
import { Observable } from "rxjs/Observable";
import { NotificationService } from '../../notification/notification.service';
import { UtilityService } from '../../common/services/utility.service';
import { ProgramDetails } from '../data/ProgramDetails';
import { ReDocDocuments } from '../data/ReDocDocuments';
import * as moment from 'moment';

@Component({
    selector: 'xl-program-details',
    templateUrl: './program-details.component.html',
    styleUrls: ['./program-details.component.less']
})
@Injectable()
export class ProgramDetailsComponent implements OnInit {

    @Input() programNumber: string;
    @Input() programTitle: string;
    @Input() IsRenew: string;
    @Input() IsAddNewContractForm: boolean;
    showAttachmentPopup = false;
    contractNumber: string;
    showViewDocumentDialog = false;
    showViewReportDialog = false;
    programDetail = [];
    viewDoc = [];
    viewReportData = [];
    reportsCount: number;
    viewDocLength: any = null;
    userId: string;
    teams = [];
    private headers: Headers;
    reDocAppLink: string;
    recapAppLink: string;
    recap_CedantLink: string;
    recap_BrokerLink: string;
    private _versionNumber: number = -1;
    currentCtr: any;
    currentVersion: any;
    currentBrokerAddressSecurityStatus: any;
    currentCedantAddressSecurityStatus: any;
    tableVal = [];
    showClearance = false;
    programDetailArea = false;
    minDate: string = '0001-01-01T00:00:00';
    IsDestinyReadWriteUser = false;
    IsCurrentContractIsProportional = false;
    isUserAccessable = false;
    userAllCompanies = [];
    companyGuid: any;
    showUpdateTrackingDatesDialog = false;
    isReadyForRenewal = false;
    isRenewed = false;
    xlerateContractNumbers: number[] = [];
    isUwReadOnlyUser: boolean;
    defaultTrackingDatesLst = [];
    latestTrackingDate: string;
    latestTrackingStatus: string;
    selectedVersionForTrackingDates: any;


    public uploader: FileUploader;
    public hasBaseDropZoneOver: boolean = false;


    constructor(private _webapi: WebApiService, private _route: ActivatedRoute
        , private _notify: NotificationService
        , private _router: Router, private _fp: FoolproofControlService, private _init: InitialDataService,
        private _utility: UtilityService) {
        this.userId = this._init.UserId;
        this.reDocAppLink = this._init.ReDocAppLink;
        this.recap_CedantLink = this._init.ReCapCedantLink;
        this.recap_BrokerLink = this._init.ReCapBrokerLink;
        this.userAllCompanies = this._init.UserAllCompanies;
        this.isUwReadOnlyUser = (this._init.IsUnderwriter || this._init.IsActuary);

        let url = this._webapi.getFinalUrl('/api/program/ProgramFileUpload/');
        this.uploader = new FileUploader({ url: url });

        this.uploader.onAfterAddingAll = (): void => {
            this.showUploadDocument();
        }
    }

    ngOnInit() {
        this.programNumber = this._route.snapshot.paramMap.get('programNum');
        this.programTitle = this._utility.DecodeToBase64Unicode(this._route.snapshot.paramMap.get('ProgramTitle'));
        this.IsRenew = this._route.snapshot.paramMap.get('IsRenew');

        if (this.IsRenew === 'true') {
            this._notify.success("Program renewed successfully and shows in the underwriter’s ‘Pending’ view.");
        }

        let isReadyForRenewalParam = this._route.snapshot.paramMap.get('IsReadyForRenewal');
        let IsRenewedParam = this._route.snapshot.paramMap.get('IsRenewed');
        if (isReadyForRenewalParam && IsRenewedParam) {
            this.isReadyForRenewal = (isReadyForRenewalParam == "true");
            this.isRenewed = (IsRenewedParam == "true");
        }

        this.getProgramDetail();
    }

    public fileOverBase(e: any): void {
        this.hasBaseDropZoneOver = e;
        this.showUploadDocument();
    }

    showUploadDocument() {
        if (this.IsDestinyReadWriteUser) {
            this.showAttachmentPopup = true;
        }
    }

    onUploadClosed = (val): void => {
        if (val) {
            this.viewDocLength = null;
        }
    }

    onUploadCompleted = (val): void => {
        this.viewDoc = [];
        this.viewDocLength = null;
        this.getviewDocCount();
    }


    onContractTabClick = (contract: any): void => {
        this.currentCtr = contract;
        //// Address and Seurity status for cedant and broker
        this.currentCedantAddressSecurityStatus = this.currentCtr.cedantAddressSecurityStatus != null ? this.currentCtr.cedantAddressSecurityStatus : undefined;
        this.currentBrokerAddressSecurityStatus = this.currentCtr.brokerAddressSecurityStatus != null ? this.currentCtr.brokerAddressSecurityStatus : undefined;

        this.currentVersion = this.currentCtr.versions[0];
        this.tableVal = this.currentVersion.layers;
        this.IsCurrentContractIsProportional = this.currentCtr.entry.modelType == 'Proportional';
        if (this.currentCtr.versions && this.currentCtr.versions.length > 0) {
            this.PrepareTrackingDatesData(this.currentCtr);
            this.currentVersion = this.currentCtr.versions[0];
            this._fp.InitMultiTextDropdown("select-quote-" + this.currentCtr.entry.xLeRateContractNumber, this.ConvertContratVersionOptions(this.currentCtr.contractVersions), this.onSelectChangeEvent);
        }
    }

    getProgramDetail = (): void => {
        // var url = '/api/program/ProgramDetails?programNum=' + this.programNumber;
        // this._webapi.get(url).map(res => res.json()).subscribe(

        this.programDetail = ProgramDetails;
        debugger;
        //check unauthorized  program access 
        // this.isUserAccessable = this.isUserAccessableProgram(this.programDetail);
        this.isUserAccessable = true;
        if (this.isUserAccessable) {

            this.getviewDocCount();

            if (this.programDetail.length > 0) {
                this.currentCtr = this.programDetail[0];

                //// Address and Seurity status for cedant and broker
                this.currentCedantAddressSecurityStatus = this.currentCtr.cedantAddressSecurityStatus != null ? this.currentCtr.cedantAddressSecurityStatus : undefined;
                this.currentBrokerAddressSecurityStatus = this.currentCtr.brokerAddressSecurityStatus != null ? this.currentCtr.brokerAddressSecurityStatus : undefined;

                if (this.currentCtr.versions && this.currentCtr.versions.length > 0) {
                    this.PrepareTrackingDatesData(this.currentCtr);
                    this.IsCurrentContractIsProportional = this.currentCtr.entry.modelType == 'Proportional';
                    this.currentVersion = this.currentCtr.versions[0];
                    this.tableVal = this.currentVersion.layers;
                }
                this.recap_CedantLink = this.recap_CedantLink + this.currentCtr.entry.cedentDestinyGuid;
                this.recap_BrokerLink = this.recap_BrokerLink + this.currentCtr.entry.brokerGuid;
                this.IsDestinyReadWriteUser = this.isUserEditableProgram(this.programDetail);

                for (let p of this.programDetail) {
                    this.xlerateContractNumbers.push(p.entry.xLeRateContractNumber);
                }
            }

            var that = this;
            setTimeout(function () {
                that._fp.Tabbed.InitTabbed();
                that._fp.InitDropdown();
                that._fp.InitMultiTextDropdown("select-quote-" + that.currentCtr.entry.xLeRateContractNumber, that.ConvertContratVersionOptions(that.currentCtr.contractVersions), that.onSelectChangeEvent);
                that._fp.InitTableScroller();
            }, 1500);
        }
        else {
            this._notify.error("Sorry but you don't have access to this program... ");
        }
    }

    convertAsDateObject = (defaultTrackingDatesList: any[]): any[] => {
        if (defaultTrackingDatesList) {
            for (let defaultTrackingDates of defaultTrackingDatesList) {
                defaultTrackingDates.value = defaultTrackingDates.value ? new Date(defaultTrackingDates.value) : null;
            }
            return defaultTrackingDatesList;
        }
    }

    onSelectChangeEvent = (value: string, text: string): void => {
        this.currentVersion = [];
        let that = this;
        this.currentCtr.versions.forEach(function (versionRow, index) {
            console.log(versionRow);
            if (parseInt(versionRow.entry.xLeRateVersionNumber) === parseInt(value)) {
                that.currentVersion = versionRow;
                that.tableVal = that.currentVersion.layers;
                return true;
            }
        });
    }

    isUserAccessableProgram = (programDetails: any[]): any => {
        let companyCollection = this._init.UserAllCompanies;
        if (this.isUwReadOnlyUser)
            return true;

        if (companyCollection) {
            for (var prgm of programDetails) {
                if (companyCollection.findIndex((comp, index) => comp.companyGUID == prgm.entry.companyGuid) > -1) {
                    return true;
                }
            }
        }
        return false;
    }

    getviewDocCount = (): void => {
        // var url = '/api/program/ReDocDocuments?programNum=' + this.programNumber + '&contractGuid=1';// + contract.entry.xLeRateContractNumber;
        // this._webapi.get(url, false).map(res => res.json()).subscribe(
            // (data) => {
                let data = ReDocDocuments;
                if (data) {
                    this.viewDoc = data;
                    this.viewDocLength = data.length;

                    this.viewReportData = this.viewDoc.filter(rep => rep.document.startsWith('ClearanceReport-'));
                    if (this.viewReportData == null) {
                        this.viewReportData = [];
                        this.reportsCount = 0;
                    } else {
                        this.reportsCount = this.viewReportData.length;
                    }
                } else {
                    this.viewDocLength = 0;
                    this.reportsCount = 0;
                }
    }

    isUserEditableProgram = (programDetails: any[]): boolean => {
        return this.getFirstEditableContract(programDetails) != null;
    }

    getFirstEditableContract = (programDetails: any[]): any => {
        let companyCollection = this._init.UserCompanies;
        if (companyCollection) {
            for (var prgm of programDetails) {
                if (companyCollection.findIndex((comp, index) => comp.companyGUID == prgm.entry.companyGuid) > -1) {
                    return prgm;
                }
            }
        }
        return null;
    }

    getUnderwitterPhotoUrlName = (underwitterName: string): string => {
        return this._init.RetrieveUserPhotoUrl(underwitterName);
    }

    //getProgramDetail = (): void => {        
    //    this.programDetail = prgDetails;
    //    this.handleContractClick(null, this.programDetail[0]);
    //}

    //handleContractClick = (event: any, contract: any): void => {        
    //    this.currentCtr = contract;
    //    // Address and Seurity status for cedant and broker
    //    this.currentCedantAddressSecurityStatus = this.currentCtr.cedantAddressSecurityStatus != null ? this.currentCtr.cedantAddressSecurityStatus : undefined;
    //    this.currentBrokerAddressSecurityStatus = this.currentCtr.brokerAddressSecurityStatus != null ? this.currentCtr.brokerAddressSecurityStatus : undefined;

    //    this.currentVersion = this.currentCtr.versions[0];
    //    this.tableVal = this.currentVersion.layers;
    //    this.IsCurrentContractIsProportional = this.currentCtr.entry.modelType == 'Proportional';
    //    console.log(JSON.stringify(this.currentVersion.entry));
    //}

    handleCollapseEvent = (): void => {
        this.programDetailArea = !this.programDetailArea;
    }

    showViewDocument = (): void => {
        this.showViewDocumentDialog = !this.showViewDocumentDialog;
        this.showUpdateTrackingDatesDialog = false;
        this.showClearance = false;
    }

    showClearanceDialog = (): void => {
        this.showViewDocumentDialog = false;
        this.showUpdateTrackingDatesDialog = false;
        this.showClearance = !this.showClearance
    }

    showUpdateTrackingDate = (): void => {
        this.showViewDocumentDialog = false;
        this.showUpdateTrackingDatesDialog = !this.showUpdateTrackingDatesDialog;
        this.showClearance = false;
    }

    onUpdateTrackingDate(programSelectedVersion: any): void {
        this.selectedVersionForTrackingDates.entry = programSelectedVersion;
    }

    onUpdateTrackingDateClosed(isShowUpdateTrackingDatesDialog: boolean): void {
        this.showUpdateTrackingDatesDialog = isShowUpdateTrackingDatesDialog;
    }

    PrepareTrackingDatesData(currentCtr): void {
        this.defaultTrackingDatesLst = this.convertAsDateObject(currentCtr.defaultTrackingDatesList.filter((val, index) => index < currentCtr.defaultTrackingDatesList.length - 2));

        var getSelectedVersionNumberRow = currentCtr.defaultTrackingDatesList.filter((val, index) => index == currentCtr.defaultTrackingDatesList.length - 1);
        this.selectedVersionForTrackingDates = currentCtr.versions.filter(tsk => tsk.entry.xLeRateVersionNumber === getSelectedVersionNumberRow[0].key)[0];

        var getLatestStatusRow = currentCtr.defaultTrackingDatesList.filter((val, index) => index == currentCtr.defaultTrackingDatesList.length - 2);
        this.latestTrackingStatus = getLatestStatusRow[0].key;
        this.latestTrackingDate = getLatestStatusRow[0].value ? moment(getLatestStatusRow[0].value).format('DD-MMM-YYYY') : moment(new Date()).format('DD-MMM-YYYY');
    }

    CheckXleRateAppInstance = (xLeRateContractNumber: string): boolean => {
        let isXleRateInstanceExist = false;
        var url = '/api/program/CheckXleRateAppInstance?version=' + this.currentVersion.entry.xLeRateVersionNumber;
        this._webapi.get(url, false).map(res => res.json()).subscribe(
            (data) => {
                isXleRateInstanceExist = data;
            },
            (err) => console.log(err),
            () => {
                if (!isXleRateInstanceExist) {
                    document.getElementById("hrefXleRateCitrixApp").click();
                }
            }
        );
        return false;
    }

    /* add New Contract */
    addNewContract = (progamNum: string): void => {
        if (this.IsDestinyReadWriteUser) {
            //this._router.navigate(['/addnewcontract', this.programNumber, this.programTitle]);
            var contract = this.getFirstEditableContract(this.programDetail);
            this._router.navigate(['/addnewcontract', this.programNumber, this._utility.EncodeToBase64Unicode(this.programTitle)
                , this.isReadyForRenewal
                , this.isRenewed
                , contract.entry.cedentDestinyGuid
                , contract.entry.cedantLocationDestinyGuid
                , contract.entry.brokerGuid
                , contract.entry.brokerLocationDestinyGuid]);
        }
    }

    ConvertContratVersionOptions = (options: any): any => {
        let jsonContratVersionOptions = JSON.stringify(options);
        jsonContratVersionOptions = jsonContratVersionOptions.replace(/quote:/g, 'Quote:');
        jsonContratVersionOptions = jsonContratVersionOptions.replace(/bound:/g, 'Bound:');
        jsonContratVersionOptions = jsonContratVersionOptions.replace(/cancelled:/g, 'Cancelled:');
        jsonContratVersionOptions = jsonContratVersionOptions.replace(/issued:/g, 'Issued:');
        jsonContratVersionOptions = jsonContratVersionOptions.replace(/declined:/g, 'Declined:');
        jsonContratVersionOptions = jsonContratVersionOptions.replace(/received:/g, 'Received:');
        jsonContratVersionOptions = jsonContratVersionOptions.replace(/unbound:/g, 'Unbound:');
        jsonContratVersionOptions = jsonContratVersionOptions.replace(/submission:/g, 'Submission:');
        jsonContratVersionOptions = jsonContratVersionOptions.replace(/quoting:/g, 'Quoting:');
        jsonContratVersionOptions = jsonContratVersionOptions.replace(/proforma:/g, 'Proforma:');
        jsonContratVersionOptions = jsonContratVersionOptions.replace(/pro Forma:/g, 'Pro forma:');
        jsonContratVersionOptions = jsonContratVersionOptions.replace(/ntu:/g, 'NTU:');
        jsonContratVersionOptions = jsonContratVersionOptions.replace(/ntU:/g, 'NTU:');
        jsonContratVersionOptions = jsonContratVersionOptions.replace(/authorised:/g, 'Authorised:');
        let contractVersion = JSON.parse(jsonContratVersionOptions);
        return contractVersion;
    }

    //Renew programs
    renew = (progamNum: string): void => {
        this._router.navigate(['/renewsubmission', progamNum]);
    }
}



//import { Component, OnInit, Input } from '@angular/core';
//import { Router, ActivatedRoute, ParamMap } from '@angular/router';
//import { Headers, RequestOptions } from '@angular/http';
//import { FileUploader } from 'ng2-file-upload';
//import { WebApiService } from '../../common/services/web-api.service';
//import { FoolproofControlService } from "../../common/services/foolproof-control.service";
//import { InitialDataService } from '../../common/services/initial-data.service';
//import { Observable } from "rxjs/Observable";
//import { NotificationService } from '../../notification/notification.service';

//@Component({
//    selector: 'xl-program-details',
//    templateUrl: './program-details.component.html',
//    styleUrls: ['./program-details.component.less']
//})
//export class ProgramDetailsComponent implements OnInit {

//    @Input() programNumber: string;
//    @Input() programTitle: string;
//    @Input() IsRenew: string;
//    @Input() IsAddNewContractForm: boolean;
//    showAttachmentPopup = false;
//    contractNumber: string;
//    showViewDocumentDialog = false;
//    showViewReportDialog = false;
//    programDetail = [];
//    viewDoc = [];
//    viewReportData = [];
//    reportsCount: number;
//    viewDocLength: any = null;
//    userId: string;
//    teams = [];
//    private headers: Headers;
//    reDocAppLink: string;
//    recapAppLink: string;
//    recap_CedantLink: string;
//    recap_BrokerLink: string;
//    private _versionNumber: number = -1;
//    currentCtr: any;
//    currentVersion: any;
//   // currentCompanyLocationSecurity: any;
//    currentBrokerAddressSecurityStatus: any;
//    currentCedantAddressSecurityStatus: any;
//    tableVal = [];
//    //tableVal1 = [];
//    //tableVal2 = [];
//    minDate: string = '0001-01-01T00:00:00';
//    IsDestinyReadWriteUser = false;
//    IsCurrentContractIsProportional = false;
//    isUserAccessable = false;
//    userAllCompanies = [];
//    companyGuid: any;
//    showUpdateTrackingDatesDialog = false;
//    isReadyForRenewal = false;
//    isRenewed = false;
//    xlerateContractNumbers: number[] = [];
//    isUwReadOnlyUser: boolean;
//    defaultTrackingDatesList= [];

//    constructor(private _webapi: WebApiService, private _route: ActivatedRoute
//        , private _notify: NotificationService
//        , private _router: Router, private _fp: FoolproofControlService, private _init: InitialDataService) {
//        this.userId = this._init.UserId;
//        this.reDocAppLink = this._init.ReDocAppLink;
//        this.recap_CedantLink = this._init.ReCapCedantLink;
//        this.recap_BrokerLink = this._init.ReCapBrokerLink;
//        this.userAllCompanies = this._init.UserAllCompanies;
//        this.isUwReadOnlyUser = (this._init.IsUnderwriter || this._init.IsActuary);
//    }

//    ngOnInit() {
//        this.programNumber = this._route.snapshot.paramMap.get('programNum');
//        this.programTitle = this._route.snapshot.paramMap.get('ProgramTitle');
//        this.IsRenew = this._route.snapshot.paramMap.get('IsRenew');

//        if (this.IsRenew === 'true') {
//            this._notify.success("Program renewed successfully and shows in the underwriter’s ‘Pending’ view.");
//        }

//        if (this._init.programDetailsRenewFlags && this._init.programDetailsRenewFlags.programNumber == this.programNumber) {
//            this.isReadyForRenewal = this._init.programDetailsRenewFlags.isReadyForRenewal;
//            this.isRenewed = this._init.programDetailsRenewFlags.isRenewed;
//        }

//        this.getProgramDetail();
//    }

//    onContractTabClick = (contract: any): void => {
//        this.currentCtr = contract;
//        //// Address and Seurity status for cedant and broker
//        this.currentCedantAddressSecurityStatus = this.currentCtr.cedantAddressSecurityStatus != null ? this.currentCtr.cedantAddressSecurityStatus : undefined;
//        this.currentBrokerAddressSecurityStatus = this.currentCtr.brokerAddressSecurityStatus != null ? this.currentCtr.brokerAddressSecurityStatus : undefined;
//        this.defaultTrackingDatesList = this.currentCtr.defaultTrackingDatesList != null ? this.currentCtr.defaultTrackingDatesList : undefined;

//        this.currentVersion = this.currentCtr.versions[0];
//        this.tableVal = this.currentVersion.layers;
//        this.IsCurrentContractIsProportional = this.currentCtr.entry.modelType == 'Proportional';        
//        if (this.currentCtr.versions && this.currentCtr.versions.length > 0) {
//            this.currentVersion = this.currentCtr.versions[0];
//            this._fp.InitMultiTextDropdown("select-quote-" + this.currentCtr.entry.xLeRateContractNumber, this.ConvertContratVersionOptions(this.currentCtr.contractVersions), this.onSelectChangeEvent);
//        }        
//    }

//    getProgramDetail = (): void => {
//        var url = '/api/program/ProgramDetails?programNum=' + this.programNumber;
//        this._webapi.get(url).map(res => res.json()).subscribe(
//            (data) => {
//                this.programDetail = data;

//                //check unauthorized  program access 
//                this.isUserAccessable = this.isUserAccessableProgram(this.programDetail);

//                if (this.isUserAccessable) {

//                    this.getviewDocCount();

//                    if (this.programDetail.length > 0) {
//                        this.currentCtr = this.programDetail[0];

//                        //// Address and Seurity status for cedant and broker
//                        this.currentCedantAddressSecurityStatus = this.currentCtr.cedantAddressSecurityStatus != null ? this.currentCtr.cedantAddressSecurityStatus : undefined;
//                        this.currentBrokerAddressSecurityStatus = this.currentCtr.brokerAddressSecurityStatus != null ? this.currentCtr.brokerAddressSecurityStatus : undefined;
//                        this.defaultTrackingDatesList = this.currentCtr.defaultTrackingDatesList != null ? this.currentCtr.defaultTrackingDatesList : undefined;

//                        if (this.currentCtr.versions && this.currentCtr.versions.length > 0) {
//                            this.IsCurrentContractIsProportional = this.currentCtr.entry.modelType == 'Proportional';
//                            this.currentVersion = this.currentCtr.versions[0];
//                            this.tableVal = this.currentVersion.layers;
//                        }
//                        this.recap_CedantLink = this.recap_CedantLink + this.currentCtr.entry.cedentDestinyGuid;
//                        this.recap_BrokerLink = this.recap_BrokerLink + this.currentCtr.entry.brokerGuid;
//                        this.IsDestinyReadWriteUser = this.isUserEditableProgram(this.programDetail);

//                        for (let p of this.programDetail) {
//                            this.xlerateContractNumbers.push(p.entry.xLeRateContractNumber);
//                        }
//                    }

//                    var that = this;
//                    setTimeout(function () {
//                        that._fp.Tabbed.InitTabbed();
//                        that._fp.InitDropdown();
//                        that._fp.InitMultiTextDropdown("select-quote-" + that.currentCtr.entry.xLeRateContractNumber, that.ConvertContratVersionOptions(that.currentCtr.contractVersions), that.onSelectChangeEvent);
//                        that._fp.InitTableScroller();                        
//                    }, 1500);
//                }
//                else {
//                    this._notify.error("Sorry but you don't have access to this program... ");
//                }
//            },
//            (err) => console.log(err)
//        );
//    }

//    /* add New Contract */
//    addNewContract = (progamNum: string): void => {
//        if (this.IsDestinyReadWriteUser) {
//            //this._router.navigate(['/addnewcontract', this.programNumber, this.programTitle]);
//            var contract = this.getFirstEditableContract(this.programDetail);
//            this._router.navigate(['/addnewcontract', this.programNumber, this.programTitle
//                , contract.entry.cedentDestinyGuid
//                , contract.entry.cedantLocationDestinyGuid
//                , contract.entry.brokerGuid
//                , contract.entry.brokerLocationDestinyGuid]);
//        }
//    }


//    getviewDocCount = (): void => {
//        var url = '/api/program/ReDocDocuments?programNum=' + this.programNumber + '&contractGuid=1';// + contract.entry.xLeRateContractNumber;
//        this._webapi.get(url, false).map(res => res.json()).subscribe(
//            (data) => {
//                if (data) {
//                    this.viewDoc = data;
//                    this.viewDocLength = data.length;

//                    this.viewReportData = this.viewDoc.filter(rep => rep.document.startsWith('ClearanceReport-'));
//                    if (this.viewReportData == null) {
//                        this.viewReportData = [];
//                        this.reportsCount = 0;
//                    } else {
//                        this.reportsCount = this.viewReportData.length;
//                    }
//                } else {
//                    this.viewDocLength = 0;
//                    this.reportsCount = 0;
//                }
//            },
//            (error) => {
//                //this.message = error;
//                this.viewDocLength = 0;
//            });

//    }

//    onSelectChangeEvent = (value: string, text: string): void => {
//        this.currentVersion = [];
//        let that = this;
//        this.currentCtr.versions.forEach(function (versionRow, index) {
//            console.log(versionRow);
//            if (parseInt(versionRow.entry.xLeRateVersionNumber) === parseInt(value)) {
//                that.currentVersion = versionRow;
//                that.tableVal = that.currentVersion.layers;
//                return true;
//            }
//        });
//    }

//    onViewDocumentClosed(isShowViewDocument: boolean): void {
//        this.showViewDocumentDialog = isShowViewDocument;
//    }

//    onViewReportClosed(isShowReportDocument: boolean): void {
//        this.showViewReportDialog = isShowReportDocument;
//    }

//    ConvertContratVersionOptions = (options: any): any => {
//        let jsonContratVersionOptions = JSON.stringify(options);
//        jsonContratVersionOptions = jsonContratVersionOptions.replace(/quote:/g, 'Quote:');
//        jsonContratVersionOptions = jsonContratVersionOptions.replace(/bound:/g, 'Bound:');
//        jsonContratVersionOptions = jsonContratVersionOptions.replace(/cancelled:/g, 'Cancelled:');
//        jsonContratVersionOptions = jsonContratVersionOptions.replace(/issued:/g, 'Issued:');
//        jsonContratVersionOptions = jsonContratVersionOptions.replace(/declined:/g, 'Declined:');
//        jsonContratVersionOptions = jsonContratVersionOptions.replace(/received:/g, 'Received:');
//        jsonContratVersionOptions = jsonContratVersionOptions.replace(/unbound:/g, 'Unbound:');
//        jsonContratVersionOptions = jsonContratVersionOptions.replace(/submission:/g, 'Submission:');
//        jsonContratVersionOptions = jsonContratVersionOptions.replace(/quoting:/g, 'Quoting:');
//        jsonContratVersionOptions = jsonContratVersionOptions.replace(/proforma:/g, 'Proforma:');
//        jsonContratVersionOptions = jsonContratVersionOptions.replace(/pro Forma:/g, 'Pro forma:');
//        jsonContratVersionOptions = jsonContratVersionOptions.replace(/ntu:/g, 'NTU:');
//        jsonContratVersionOptions = jsonContratVersionOptions.replace(/ntU:/g, 'NTU:');
//        jsonContratVersionOptions = jsonContratVersionOptions.replace(/authorised:/g, 'Authorised:');
//        let contractVersion = JSON.parse(jsonContratVersionOptions);
//        return contractVersion;
//    }

//    onUploadClosed = (val): void => {
//        if (val) {
//            this.viewDocLength = null;
//        }
//    }

//    onUploadCompleted = (val): void => {
//        this.viewDoc = [];
//        this.viewDocLength = null;
//        this.getviewDocCount();
//    }

//    showDocumentAttacher() {
//        if (this.IsDestinyReadWriteUser) {
//            this.showAttachmentPopup = true;
//        }
//    }




//    getUnderwitterPhotoUrlName = (underwitterName: string): string => {
//        return this._init.RetrieveUserPhotoUrl(underwitterName);
//    }

//    isUserEditableProgram = (programDetails: any[]): boolean => {
//        return this.getFirstEditableContract(programDetails) != null;
//    }

//    isUserAccessableProgram = (programDetails: any[]): any => {
//        let companyCollection = this._init.UserAllCompanies;
//        if (this.isUwReadOnlyUser)        
//            return true;

//        if (companyCollection) {
//            for (var prgm of programDetails) {
//                if (companyCollection.findIndex((comp, index) => comp.companyGUID == prgm.entry.companyGuid) > -1) {
//                    return true;
//                }
//            }
//        }
//        return false;
//    }

//    getFirstEditableContract = (programDetails: any[]): any => {
//        let companyCollection = this._init.UserCompanies;
//        if (companyCollection) {
//            for (var prgm of programDetails) {
//                if (companyCollection.findIndex((comp, index) => comp.companyGUID == prgm.entry.companyGuid) > -1) {
//                    return prgm;
//                }
//            }
//        }
//        return null;
//    }

//    CheckXleRateAppInstance = (xLeRateContractNumber: string): boolean => {
//        let isXleRateInstanceExist = false;
//        var url = '/api/program/CheckXleRateAppInstance?version=' + this.currentVersion.entry.xLeRateVersionNumber;
//        this._webapi.get(url, false).map(res => res.json()).subscribe(
//            (data) => {
//                isXleRateInstanceExist = data;
//            },
//            (err) => console.log(err),
//            () => {
//                if (!isXleRateInstanceExist) {
//                    document.getElementById("hrefXleRateCitrixApp").click();
//                }
//            }
//        );
//        return false;
//    }    

//    runClearanceReprot = (): void => {
//        var url = '/api/Program/CreateClearanceReport?programNum=' + this.programNumber
//            + "&cedantGuid=" + this.currentCtr.entry.cedentDestinyGuid;
//        this._webapi.get(url).map(res => res.json()).subscribe(
//            (result) => {
//                if (result) {
//                    this.viewDoc = [];
//                    this.viewDocLength = null;
//                    this.viewReportData = [];
//                    this.reportsCount = null;
//                    this.getviewDocCount();
//                }
//                else {
//                    this._notify.error("Failed to run clearance report");
//                }
//            },
//            (err) => {
//                this._notify.error("Failed to run clearance report");
//            },
//            () => {

//            }
//        );
//    }

//    onUpdateTrackingDate(programCurrentVersion: any): void {
//        this.currentVersion.entry = programCurrentVersion;
//    }

//    onUpdateTrackingDateClosed(isShowUpdateTrackingDatesDialog: boolean): void {
//        this.showUpdateTrackingDatesDialog = isShowUpdateTrackingDatesDialog;
//    }

//    //Renew programs
//    renew = (progamNum: string): void => {
//        this._router.navigate(['/renewsubmission', progamNum]);
//    }
//}
