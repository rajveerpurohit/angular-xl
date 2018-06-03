import { Component, OnInit } from '@angular/core';
import { NewSubmissionService } from './services/newsubmission-data.service';
import { SubmissionModel } from './models/submission.model';
import { InitialDataService } from '../common/services/initial-data.service';
import { FoolproofControlService } from '../common/services/foolproof-control.service';
import { Router, ActivatedRoute, ParamMap, NavigationEnd, NavigationStart } from '@angular/router';
import { NotificationService } from '../notification/notification.service';

@Component({
    selector: 'xl-newsubmission',
    templateUrl: './newsubmission.component.html',
    styleUrls: ['./newsubmission.component.less']
})
export class NewSubmissionComponent implements OnInit {
    newsubmission: SubmissionModel;
    message: string;

    constructor(private dataService: NewSubmissionService, private _router: Router
        , private _notify: NotificationService
        , private _fp: FoolproofControlService, private _initService: InitialDataService) {
        this._router.events.subscribe((evt) => {
            if (evt instanceof NavigationEnd) {                
                this.InitiateNewSubmission();
            }            
        });
    }

    ngOnInit() {        
        if (!this.newsubmission) {
            this.InitiateNewSubmission();
        }
        //if (this.newsubmission) {
        //    var that = this;
        //    //setTimeout(function () {
        //    //    that._fp.InitDropdown();
        //    //}, 2500);
        //}        
    }

    reset = (): void => {        
        this._router.navigate(['/home']);
    }

    get isValid(): boolean {
        if (this.newsubmission.companyKey
            && this.newsubmission.underwriter
            && this.newsubmission.uwYear
            && this.newsubmission.effectiveDate
            && this.newsubmission.expirationDate
            && this.newsubmission.programTitle
            && this.newsubmission.cedantKey
            && this.newsubmission.cedantName.length > 0
            && this.newsubmission.brokerKey
            && this.newsubmission.brokerName.length > 0
            && this.newsubmission.cedantLocationKey
            && this.newsubmission.brokerLocationKey
            && this.newsubmission.clearanceOfficeGuid
            && this.newsubmission.clearanceOfficeName
            && this.newsubmission.coverageGuid
            && this.newsubmission.coverageDescription
            && this.newsubmission.lineOfBusinessdescription
            && this.newsubmission.subLineofBusinessdescription
            && this.newsubmission.subLineofBusinessguid
            && this.newsubmission.submissionDate
            && this.newsubmission.dateCleared
        ) {
            return true;
        }
        return false;
    }

    public addSubmission() {
        this._notify.clear();
        this.dataService
            .Add(this.newsubmission)
            .subscribe((data) => {
                if (data) {
                    if (data.comments && data.comments.length > 0) {
                        this._notify.error(data.comments);
                        //this.InitiateNewSubmission();
                    }
                    else {
                        this._router.navigate(['/home', 4, 'Pending', '1']);
                    }
                }
            },
            (error) => {
                //console.log(error);
                this._notify.error(error);
            });
    }

    submissionChangedEvent(newSubmissionChanged: SubmissionModel): void {
        this.newsubmission = newSubmissionChanged;
    }

    afterInitEvent(completed: any) {

        //setTimeout((): void => {
        //    //this._fp.InitDropdown();
        //    this.show = false;
        //}, 1500);

        if (!completed)
        {
            this._notify.error("Loading Initial data failed.");
        }
    }

    private InitiateNewSubmission() {
        this.newsubmission = new SubmissionModel();

        let temp = new Date();
        temp.setMonth(temp.getMonth() + 1);
        this.newsubmission.effectiveDate = new Date(temp.getFullYear(), temp.getMonth(), 1);
        this.newsubmission.uwYear = this.newsubmission.effectiveDate.getFullYear();

        let temp1 = new Date(JSON.parse(JSON.stringify(this.newsubmission.effectiveDate)));

        temp1.setFullYear(temp1.getFullYear() + 1);
        temp1.setDate(temp1.getDate() - 1);
        this.newsubmission.expirationDate = temp1;
        var defaultCompany = this._initService.RetrieveDefaultCompany();
        if (defaultCompany) {
            this.newsubmission.companyKey = Number.parseInt(defaultCompany);
        }

        this.newsubmission.underwriter = this._initService.RetrieveDefaultUnderwriter();
        console.log("DefaultUnderwriter : " + this.newsubmission.underwriter )

    }
    
}