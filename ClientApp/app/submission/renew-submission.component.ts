import { Component, OnInit, Input } from '@angular/core';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import 'rxjs/add/operator/switchMap';
import { NgForm } from '@angular/forms';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/startWith';
import 'rxjs/add/operator/map';
import '../common/extensions/date-ext';
import { NewSubmissionService } from './services/newsubmission-data.service';
import { SubmissionModel } from './models/submission.model';
import { WebApiService } from '../common/services/web-api.service';
import { FoolproofControlService } from '../common/services/foolproof-control.service';
import { NotificationService } from '../notification/notification.service';
import { UtilityService } from '../common/services/utility.service';

@Component({
    selector: 'uwwb-renewsubmission',
    templateUrl: './renew-submission.component.html'
})
export class RenewSubmissionComponent implements OnInit {
    @Input() programNum: string;
    message: string;
    showfiscalYear = false;
    fiscalYear: string;
    submission: any;
    workFlowAssginedUser: string = '';
    workFlowAssign: any[];

    constructor(private _webapi: WebApiService, private _route: ActivatedRoute
        , private _notify: NotificationService
        , private _router: Router
        , private _fp: FoolproofControlService
        , private _utility: UtilityService) { }

    ngOnInit() {
        this.programNum = this._route.snapshot.paramMap.get('programNum');
        this._webapi.get("/api/program/RenewProgram?programNumber=" + this.programNum)
            .map(resp => resp.json())
            .subscribe(data => {
                if (data) {
                    this.submission = data;
                    this.setFiscalYear(data);
                    this.setWorkflowAssignedUser(data);
                }
            });
    }

    setFiscalYear(data: any) {
        if (data.companyRegion === "North America") {
            if (data.effectiveDate === "Multiple") {
                this.fiscalYear = "Multiple";
            } else {
                let temp = new Date(data.effectiveDate);
                temp.setDate(temp.getMonth() + 1);
                this.fiscalYear = temp.getFullYear().toString();
                this.showfiscalYear = true;
            }
        }
    }

    setWorkflowAssignedUser(data: any) {
        if (data.workflowAssignedUsers) {
            setTimeout(() => {
                this._fp.InitDropdown();
            }, 500);
        }
    }

    cancel = (): void => {
        this._router.navigate(['/home']);
    }

    onAssginedUserChange(val) {
        this.submission["workFlowAssginedUser"] = val;
    }

    submit = (): void => {
        this._notify.clear();
        //{ this._router.navigate(['/programdetails', this.submission.programNum, '1']); }

        let data = [];
        this.submission["workFlowAssginedUser"] = this.workFlowAssginedUser;
        this._webapi.post("/api/program/RenewProgram", this.submission).map(resp => resp.json()).subscribe(
            (data) => {
                if (data) {

                    if (data.comments && data.comments.length > 0) {
                        this._notify.error(data.comments);
                    }
                    else {
                        this._router.navigate(['/programdetails', data.programNum, 'true', this._utility.EncodeToBase64Unicode(data.programTitle)]);
                    }
                }
            },
            (error) => {
                this._notify.error(error.text());
            }
        );
    }

}