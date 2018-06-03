import { Component, AfterViewChecked, ViewChild, QueryList, OnInit, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/startWith';
import 'rxjs/add/operator/map';
import { WebApiService } from '../common/services/web-api.service';
import { KeyValuePairModel } from '../common/models/key-value-pair.model';
import { SubmissionModel } from './models/submission.model';
import { LocationModel } from './models/location.model';
import { InitialDataService } from '../common/services/initial-data.service';
import { FoolproofControlService } from '../common/services/foolproof-control.service';
import { GetXLCompanyWithUnderwriters } from './data/GetXLCompanyWithUnderwriters';
import { CedantLocations } from './data/CedantLocations';
import { BrokerLocations } from './data/brokerLocations';
declare var InitData: any;

@Component({
    selector: 'uwwb-submission',
    templateUrl: './submission.component.html',
    styleUrls: ['./submission.component.less']
})
export class SubmissionComponent implements OnInit {

    @Input() submission: SubmissionModel;
    @Input() IsRenwalForm: boolean;
    @Input() IsNewSubForm: boolean;
    @Input() IsAddNewContractForm: boolean;
    @Output() submissionChange = new EventEmitter<SubmissionModel>();
    @Output() afterInit = new EventEmitter<boolean>();
    @ViewChild('CompanyOptions') CompanyOptions: QueryList<any>;
    @ViewChild('UWOptions') UWOptions: QueryList<any>;
    @ViewChild('WorkflowAssignedOptions') WorkflowAssignedOptions: QueryList<any>;

    underwriters = [];

    companies = [];

    workFlowAssignies = [];

    resetButtonId = "btnSubmissionReset";

    cedantNamesandLocations = [];
    brokerNamesandLocations = [];
    filteredcedantNamesandLocations = [];
    filteredbrokerNamesandLocations = [];
    myCedantAutoCompleteElement: any;
    myBrokerAutoCompleteElement: any;

    showWorkflowAssignedUser: boolean = false;

    initCompleted: boolean[] = [];

    isfiscalYear: boolean = false;
    fiscalYear: number;

    constructor(private _webapi: WebApiService, private _route: ActivatedRoute, private _router: Router, private _fp: FoolproofControlService, private _initData: InitialDataService) {
    }

    ngOnInit() {
        //this.initAutoComplete('/api/ReferenceData/teamunderwriters/', this.underwriters, 'loginName', 'displayName');
        //this.initAutoComplete('/api/ReferenceData/UserCompanies/', this.companies, "companyGUID", "description");
        this.initComanyAutoComplete();
        //this.initAutoComplete('/api/ReferenceData/Cedants/', this.cedants, "companyGUID", "description");
        //this.initAutoComplete('/api/ReferenceData/Brokers/', this.brokers, "companyGUID", "description");
        this.initCedantBrokerNameLocationAutoComplete(CedantLocations, this.cedantNamesandLocations, "txtCedentName", this.myCedantAutoCompleteElement, this.onCedantFilteredChangeEvent);
        this.initCedantBrokerNameLocationAutoComplete(CedantLocations, this.brokerNamesandLocations, "txtBrokerName", this.myBrokerAutoCompleteElement, this.onBrokerFilteredChangeEvent);

        this.submissionChange.emit(this.submission);
    }

    onInitDataLoadCompleted(completed: boolean) {
        this.initCompleted.push(completed);
        if (this.initCompleted.length == 3) {
            this.afterInit.emit(this.initCompleted.every(f => f));
        }
    }

    onCompanyChange(event) {
        this.submission.companyKey = event;
        this.underwriters = [];
        this.workFlowAssignies = [];
        for (var d of this.companies) {
            if (this.submission.companyKey && this.submission.companyKey.toString() == d.companyKey) {
                this.submission.companyWorkflowGuid = d.workflowGuid;
                this.submission.companyWorkflowTaskGuid = d.workflowTaskGuid;
                this.initWorkFlowAssigned(d);
                this.initUnderwriterDropdownlist(d);
                this.setFiscalYear(d);
            }
        }
    }

    onUWChange(event) {
        this.submission.underwriter = event;
    }

    onWorkFlowAssignedChange(event) {
        this.submission.workFlowAssginedUser = event;
    }

    //init CedantLocations, brokerLocations autocomplete controls
    // initCedantBrokerNameLocationAutoComplete(url: string, options: any[], controlName: string, autoCompleteRefenrenceElement: any, onFilteredChangeEvent: any) {
    //     options = [];
    //     this._webapi.get(url).map(res => res.json()).subscribe(
    //         (data) => {
    //             if (data) {
    //                 for (var d of data) {

    //                     if (this.IsAddNewContractForm == true)
    //                     {
    //                         if (controlName == "txtCedentName") {
    //                             if (d["companyGUID"] == this.submission.cedantKey && d["productionLocationGuid"] == this.submission.cedantLocationKey) {

    //                                 this.submission.cedantName = d["description"] + ", " + d["street1"] + ", " + d["city"] + ", " + d["state"] + ", " + d["country"];
    //                             }
    //                         }
    //                         else if (controlName == "txtBrokerName")
    //                         {
    //                             if (d["companyGUID"] == this.submission.brokerKey && d["productionLocationGuid"] == this.submission.brokerLocationKey) {
    //                                 this.submission.brokerName = d["description"] + ", " + d["street1"] + ", " + d["city"] + ", " + d["state"] + ", " + d["country"];

    //                             }
    //                         }
    //                     }

    //                     let item = [d["companyGUID"] + "-" + d["productionLocationGuid"], [d["description"], d["street1"], d["city"], d["state"], d["country"]]];
    //                     options.push(item);

    //                 }
    //             }
    //             if (autoCompleteRefenrenceElement != null)
    //                 autoCompleteRefenrenceElement.destroy();
    //             autoCompleteRefenrenceElement = this._fp.autoComplete(controlName, options, onFilteredChangeEvent);
    //             this.onInitDataLoadCompleted(true);
    //         },
    //         (err) => {
    //             //console.log(err);
    //             this.onInitDataLoadCompleted(false);
    //         },
    //         () => {

    //         }
    //     );
    // };
    initCedantBrokerNameLocationAutoComplete(value: any, options: any[], controlName: string, autoCompleteRefenrenceElement: any, onFilteredChangeEvent: any) {
        options = [];
        let data = value;
        if (data) {
            for (var d of data) {

                if (this.IsAddNewContractForm == true) {
                    if (controlName == "txtCedentName") {
                        if (d["companyGUID"] == this.submission.cedantKey && d["productionLocationGuid"] == this.submission.cedantLocationKey) {

                            this.submission.cedantName = d["description"] + ", " + d["street1"] + ", " + d["city"] + ", " + d["state"] + ", " + d["country"];
                        }
                    }
                    else if (controlName == "txtBrokerName") {
                        if (d["companyGUID"] == this.submission.brokerKey && d["productionLocationGuid"] == this.submission.brokerLocationKey) {
                            this.submission.brokerName = d["description"] + ", " + d["street1"] + ", " + d["city"] + ", " + d["state"] + ", " + d["country"];

                        }
                    }
                }

                let item = [d["companyGUID"] + "-" + d["productionLocationGuid"], [d["description"], d["street1"], d["city"], d["state"], d["country"]]];
                options.push(item);

            }
        }
        if (autoCompleteRefenrenceElement != null)
            autoCompleteRefenrenceElement.destroy();
        autoCompleteRefenrenceElement = this._fp.autoComplete(controlName, options, onFilteredChangeEvent);
        this.onInitDataLoadCompleted(true);
    };

    onCedantFilteredChangeEvent = (value: string, text: string): void => {
        var keys = value.split("-");
        if (keys.length == 2) {
            this.submission.cedantKey = parseInt(keys[0]);
            this.submission.cedantLocationKey = parseInt(keys[1]);
            this.submissionChange.emit(this.submission);
        }
    }

    onBrokerFilteredChangeEvent = (value: string, text: string): void => {
        var keys = value.split("-");
        if (keys.length == 2) {
            this.submission.brokerKey = parseInt(keys[0]);
            this.submission.brokerLocationKey = parseInt(keys[1]);
            this.submissionChange.emit(this.submission);
        }
    }

    onKeypress(event) {
        this.submissionChange.emit(this.submission);
    }

    //initcompany autocomplete control
    initComanyAutoComplete() {
        // this._webapi.get("/api/ReferenceData/GetXLCompanyWithUnderwriters/").map(res => res.json()).subscribe(
        // (data) => {
        this.onInitDataLoadCompleted(true);
        let data = GetXLCompanyWithUnderwriters;
        if (data) {
            for (var d of data) {
                if (this.submission.companyKey && this.submission.companyKey.toString() == d.companyKey) {
                    this.submission.companyName = d.companyName;
                    this.submission.companyWorkflowGuid = d.workflowGuid;
                    this.submission.companyWorkflowTaskGuid = d.workflowTaskGuid;
                    this.setFiscalYear(d);
                    this.initUnderwriterDropdownlist(d);
                    this.initWorkFlowAssigned(d);
                }
            }
            this.companies = data;
        }
        //     (err) => {
        //         //console.log(err);
        //         this.onInitDataLoadCompleted(false);
        //     }
        // );
    };

    setFiscalYear(compEnt: any) {
        if (compEnt.region === "North America") {
            this.isfiscalYear = true;
            let fiscalDate = new Date(this.submission.effectiveDate);
            let Year = fiscalDate.getFullYear();

            if (fiscalDate.getMonth() === 11)
                Year++;

            this.fiscalYear = Year;
        }
        else
            this.isfiscalYear = false;
    }

    //init WorkFlowAssigned dropdown controls
    initUnderwriterDropdownlist(comp: any) {
        this.underwriters = comp.underwriter;
    }

    initWorkFlowAssigned(compEnt: any) {
        this.submission.workFlowAssginedUser = "";
        this.showWorkflowAssignedUser = (compEnt && compEnt.workflowGuid != undefined && compEnt.workflowGuid != null)
        if (this.showWorkflowAssignedUser) {
            this._webapi.get('/api/program/WorkFlowAssignedUsers?companyGuid=' + compEnt.companyKey + "&wfGuid=" + compEnt.workflowGuid + "&taskGuid=" + compEnt.workflowTaskGuid)
                .map(res => res.json())
                .subscribe(
                (data) => {
                    if (data) {
                        this.workFlowAssignies = data;
                    }
                },
                (err) => {
                }
                );
        }
    };

    selectEffectiveDateChanged(date) {
        this.submission.effectiveDate = new Date(JSON.parse(JSON.stringify(date)));
        let temp = new Date(JSON.parse(JSON.stringify(date)));
        temp.setDate(temp.getDate() + 364);
        //this.submission.uwYear = date.getFullYear();
        this.submission.uwYear = this.submission.effectiveDate.getFullYear();
        this.submission.expirationDate = temp;
        this.submissionChange.emit(this.submission);

        for (var d of this.companies) {
            if (this.submission.companyKey && this.submission.companyKey.toString() == d.companyKey) {
                this.setFiscalYear(d);
                break;
            }
        }
    }

    submissionFormErrors = {
        'companyName': '',
        'underwriterDisplayName': '',
        'uwYear': '',
        'programTitle': '',
        'cedantName': '',
        'cedantLocationFiltered': '',
        'brokerName': '',
        'brokerlocation': ''
    };

    validationMessages = {
        'companyName': {
            'required': 'Company is required.'
        },
        'underwriterDisplayName': {
            'required': 'Underwriter is required.'
        },
        'uwYear': {
            'required': 'UW Year is required.'
        },
        'programTitle': {
            'required': 'Program Title is required.'
        },
        'cedantName': {
            'required': 'Name is required.'
        },
        'cedantLocationFiltered': {
            'required': 'Cedant Location is required.'
        },
        'brokerName': {
            'required': 'Broker Name is required.'
        },
        'brokerlocation': {
            'required': 'Broker Location is required.'
        }
    };
}
