import { Component, OnInit, Input } from '@angular/core';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { NewSubmissionService } from './services/newsubmission-data.service';
import { SubmissionModel } from './models/submission.model';
import { InitialDataService } from '../common/services/initial-data.service';
import { FoolproofControlService } from '../common/services/foolproof-control.service';
import 'rxjs/add/operator/switchMap';
import { NgForm } from '@angular/forms';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/startWith';
import 'rxjs/add/operator/map';
import '../common/extensions/date-ext';
import { WebApiService } from '../common/services/web-api.service';
import { NotificationService } from '../notification/notification.service';
import { UtilityService } from '../common/services/utility.service';

@Component({
    selector: 'rwb-addnewcontract',
    templateUrl: './addnewcontract.component.html',
    styleUrls: ['./newsubmission.component.less']
})
export class AddNewContractComponent implements OnInit {
    addnewcontract: SubmissionModel;
    message: string;
    cedantKey: number;
    cedantLocationGUID: number;
    brokerGuid: number;
    brokerLocationGUID: number;
    isReadyForRenewal = false;
    isRenewed = false;

    constructor(private dataService: NewSubmissionService, private _route: ActivatedRoute
        , private _notify: NotificationService
        , private _router: Router, private _fp: FoolproofControlService
        , private _initService: InitialDataService
        , private _webapi: WebApiService
        , private _utility: UtilityService) {
    }

    ngOnInit() {
        if (!this.addnewcontract) {
            this.InitiateNewContract();
        }
    }

    afterInitEvent(completed: any) {
        if (!completed) {
            this._notify.error("Loading Initial data failed.");
        }
    }

    get isValidForm(): boolean {
        if (this.addnewcontract.companyKey
            && this.addnewcontract.underwriter
            && this.addnewcontract.uwYear
            && this.addnewcontract.effectiveDate
            && this.addnewcontract.expirationDate
            && this.addnewcontract.programTitle
            && this.addnewcontract.cedantKey
            && this.addnewcontract.cedantName.length > 0
            && this.addnewcontract.brokerKey
            && this.addnewcontract.brokerName.length > 0
            && this.addnewcontract.cedantLocationKey
            && this.addnewcontract.brokerLocationKey) {
            return true;
        }
        return false;
    }

    private InitiateNewContract() {
        this.addnewcontract = new SubmissionModel();
        this.addnewcontract.programNum = this._route.snapshot.paramMap.get('programNum');
        this.addnewcontract.programTitle = this._utility.EncodeToBase64Unicode(this._route.snapshot.paramMap.get('ProgramTitle'));

        let isReadyForRenewalParam = this._route.snapshot.paramMap.get('IsReadyForRenewal');
        let IsRenewedParam = this._route.snapshot.paramMap.get('IsRenewed');
        if (isReadyForRenewalParam && IsRenewedParam) {
            this.isReadyForRenewal = (isReadyForRenewalParam == "true");
            this.isRenewed = (IsRenewedParam == "true");
        }        

        let temp = new Date();
        temp.setMonth(temp.getMonth() + 1);
        this.addnewcontract.effectiveDate = new Date(temp.getFullYear(), temp.getMonth(), 1);
        this.addnewcontract.uwYear = this.addnewcontract.effectiveDate.getFullYear();

        let temp1 = new Date(JSON.parse(JSON.stringify(this.addnewcontract.effectiveDate)));

        temp1.setFullYear(temp1.getFullYear() + 1);
        temp1.setDate(temp1.getDate() - 1);
        this.addnewcontract.expirationDate = temp1;
        var defaultCompany = this._initService.RetrieveDefaultCompany();
        if (defaultCompany) {
            this.addnewcontract.companyKey = Number.parseInt(defaultCompany);
        }

        this.addnewcontract.underwriter = this._initService.RetrieveDefaultUnderwriter();

        this.addnewcontract.cedantName = "";
        this.addnewcontract.cedantKey = parseInt(this._route.snapshot.paramMap.get('cedantKey'));
        this.addnewcontract.cedantLocationKey = parseInt(this._route.snapshot.paramMap.get('cedantLocationGUID'));
        this.addnewcontract.brokerName = "";
        this.addnewcontract.brokerKey = parseInt(this._route.snapshot.paramMap.get('brokerGuid'));
        this.addnewcontract.brokerLocationKey = parseInt(this._route.snapshot.paramMap.get('brokerLocationGUID'));
    }

    submissionChangedEvent(addnewcontractChanged: SubmissionModel): void {
        this.addnewcontract = addnewcontractChanged;
    }


    addNewContract = (): void => {
        this._notify.clear();
        this._webapi.post("/api/program/NewProgramContract", this.addnewcontract).map(resp => resp.json()).subscribe(
            (data) => {
                if (data) {
                    if (data.comments && data.comments.length > 0) {
                        this._notify.error(data.comments);
                    }
                    else {
                        this._router.navigate(['/programdetails', this.addnewcontract.programNum, this.isReadyForRenewal, this.isRenewed, this._utility.EncodeToBase64Unicode(this.addnewcontract.programTitle), Math.floor(Math.random() * Math.floor(10000))]);
                    }
                }
            },
            (error) => {
                this._notify.error(error.text());
            }
        );
    }

    cancel = (): void => {
        this._router.navigate(['/programdetails', this.addnewcontract.programNum, this.isReadyForRenewal, this.isRenewed, this._utility.EncodeToBase64Unicode(this.addnewcontract.programTitle)]);
    }

}

