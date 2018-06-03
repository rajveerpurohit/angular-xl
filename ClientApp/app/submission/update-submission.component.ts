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

@Component({
    selector: 'uwwb-updatesubmission',
    templateUrl: './update-submission.component.html'
})
export class UpdateSubmissionComponent implements OnInit {
    @Input() programNum: string;
  //  show = true;
    copiedSubmission: SubmissionModel;
    submission = new SubmissionModel();
    message: string;
    constructor(private _webapi: WebApiService, private _route: ActivatedRoute, private _router: Router, ) { }

    ngOnInit() {
        this.programNum = this._route.snapshot.paramMap.get('programNum');


        this._webapi.get("/api/program/UpdateProgram?programNum=" + this.programNum)
            .map(resp => <SubmissionModel>resp.json())
            .subscribe(data => {
                if (data) {
                    this.submission = data;
                    this.copiedSubmission = Object.assign({}, this.submission);                   
                   // this.show = false;
                }
            });
    }

    reset = (): void => {
       // this._router.navigate(['/home']);
        this._router.navigate(['/home', 4, 'Pending']);
    }

    get isValid(): boolean {
        if (this.copiedSubmission.companyKey
            && this.copiedSubmission.underwriter
            && this.copiedSubmission.uwYear
            && this.copiedSubmission.effectiveDate
            && this.copiedSubmission.expirationDate
            && this.copiedSubmission.programTitle
            && this.copiedSubmission.programTitle.length > 0
            && this.copiedSubmission.cedantKey
            && this.copiedSubmission.cedantName.length > 0
            && this.copiedSubmission.brokerKey
            && this.copiedSubmission.brokerName.length > 0
            && this.copiedSubmission.cedantLocationKey
            && this.copiedSubmission.brokerLocationKey) {
            return true;
        }
        return false;
    }

    updateSubmission = (): void => {
       // this.show = true;
        var updateSubmissionData = { 'oldProgram':this.submission, 'newProgram':this.copiedSubmission };
        this._webapi.post("/api/program/UpdateProgram", updateSubmissionData).map(resp => resp.json()).subscribe(
            (data) => {
               // alert(data.comments);

                if (data.comments && data.comments.length > 0) {
                    this.ShowNotice(data.comments);
                    //this.InitiateNewSubmission();
                }
                else {
                    this._router.navigate(['/home', 4, 'Pending', '2']);
                }
            },
            (error) => {
                console.log(error);
                this.ShowNotice(error);
            }
           
        );
    }

    gotoPortfolioView() {
        this._router.navigate(['/portfolio']);
    }

    submissionChangedEvent(renewSubmissionChanged: SubmissionModel): void {
        this.copiedSubmission = renewSubmissionChanged;
    }

    ShowNotice = (error: string): void => {
        this.message = error;
        document.getElementsByTagName("body")[0].className = "body-with-notice";
    }
    onShowNoticeCloseClick = (): void => {
        this.message = null;
        document.getElementsByTagName("body")[0].className = "";
    }

    afterInitEvent(completed: any) {

        //setTimeout((): void => {
        //    //this._fp.InitDropdown();
        //    this.show = false;
        //}, 1500);

        if (!completed) {
            this.ShowNotice("Loading Initial data failed.");
        }
    }
}