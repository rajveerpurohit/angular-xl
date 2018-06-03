import { Component, OnInit, AfterViewInit, Input, ViewChildren, QueryList, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute, ParamMap, NavigationEnd, NavigationStart } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { Subscription } from "rxjs";
import { TimerObservable } from "rxjs/observable/TimerObservable";
import 'rxjs/add/operator/startWith';
import 'rxjs/add/operator/map';
import { WebApiService } from '../common/services/web-api.service';
import { KeyValuePairModel } from '../common/models/key-value-pair.model';
import { FoolproofControlService } from '../common/services/foolproof-control.service';
import { InitialDataService } from '../common/services/initial-data.service';
import { NotificationService } from '../notification/notification.service';
import { SearchOptions } from '../browse/models/browse.model';

@Component({
    selector: 'uwwb-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.less']
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy  {
    private subscription: Subscription;
    @Input() programType: string;
    @Input() programTypeName: string;
    @Input() IsNew: string;
    @ViewChildren('teamOptions') teamOptions: QueryList<any>;

    private _teamGuid: number = -1;
    viewType: number = 1;
    programs: any[];
    filteredPrograms: any[];
    programCount: number = 0;
    teams = [];
    teamGuid: any;

    teamFilterList: object;

    //showList: boolean = false;
    // select in common accepts an object with following values    
    showList: object;
    searchList = [];
    searchCollection: any;
    searchOptions: SearchOptions;    

    constructor(private _webapi: WebApiService
        , private _route: ActivatedRoute
        , private _router: Router
        , private _fp: FoolproofControlService
        , private _initData: InitialDataService
        , private _notify: NotificationService) {
        // override the route reuse strategy

        this._router.routeReuseStrategy.shouldReuseRoute = function () {
            return false;
        }

        this._router.events.subscribe((evt) => {
            if (evt instanceof NavigationEnd) {
                //document.getElementsByTagName("body")[0].className = "";
            }
            else if (evt instanceof NavigationStart) {
                this.subscription.unsubscribe();
            }
        });
    }

    ngOnInit() {
        this.searchOptions = new SearchOptions();
        //this.programType = this._route.snapshot.paramMap.get('programType');
        //this.programTypeName = this._route.snapshot.paramMap.get('programTypeName');

        this.IsNew = this._route.snapshot.paramMap.get('IsNew');

        if (this.IsNew == '1' || this.IsNew == '2') {
            //this.ShowNotice("Program added successfully and shows in the underwriter’s ‘Pending’ view.", "Success");
            this._notify.success("Program added successfully and shows in the underwriter’s ‘Pending’ view.");
        }
        else {
            //this.onShowNoticeCloseClick();
            this._notify.clear();
        }

        //if (!this.programType) {
        //    this.programType = "1";
        //    this.programTypeName = "In Force";
        //}
        this.retrieveSavedCriterias();
        this.getTeamOptions();

        this.autoRefresh();
    }

    ngOnDestroy() {
        //avoid memory leakage
        this.subscription.unsubscribe();
    }

    ngAfterViewInit() {
        this.teamOptions.changes.subscribe(t => {
            this._fp.InitDropdown();
        })
    }

    autoRefresh() {
        //one miniute is equal to 60000
        let timer = TimerObservable.create(300000, 300000);
        this.subscription = timer.subscribe(t => this.getPrograms());
    }

    getPrograms = (): void => {
        this.programs = [];
        var url = '/assets/json/Home/PortfolioData.json';
        this._webapi.get(url).map(res => res.json()).subscribe(
            (data) => {
                this.programs = data;
                this.filteredPrograms = this.programs;
                if (this.programs) {
                    this.programCount = this.programs.length;

                    if (this.programCount >= 200) {
                        this._notify.warn("The screen is configured to display a maximum of 200 programs");
                    }
                }
            },
            (err) => console.log(err.text())
        );

    }

    getTeamOptions() {
        this._webapi.get('/assets/json/Home/teams.json').map(res => res.json()).subscribe(
            (data) => {
                if (this._initData.IsUnderwriter) {
                    this.teamGuid = new KeyValuePairModel('0', 'My View');
                    this.teams.push(this.teamGuid);
                }
                if (data) {
                    for (var d of data) {
                        let item = new KeyValuePairModel(d.teamGuid, d.teamGuid > 0 ? 'Team -- ' + d.name : d.name);
                        this.teams.push(item);
                    }
                    if (this.teamGuid == null) {
                        this.teamGuid = this.teams[0];
                    }
                    console.log(this.searchOptions.teamGuid);
                }
                if (this.teams.length == 0) {
                    this.teams.push(new KeyValuePairModel('-1', 'All'));
                }
                this.teamFilterList = { "defaultValue": this.teamGuid, "listArray": this.teams };
              
            },
            (err) => console.log(err)
        );
    };

    exceldownlad() {
        if (this.programCount > 0) {
            if (this.programCount > 0) {
                var url = '/assets/json/Home/PortfolioData.json';
                this._webapi.downloadExcelByPost(url, this.searchOptions, "report.xlsx");
            }
        }
    }

    filterSelectedHandler = (event) => {
        // this will give the selected option for further use        
        this.teamGuid = event;
        if (this.teamGuid.key == '0') {
            this.viewType = 1;
        }
        else {
            this.viewType = 2;
        }
        this.searchOptions.teamGuid = this.teamGuid.key;
        this.getPrograms();
    }
    showSelectedHandler = ($event) => {
        if (this.searchCollection != null) {
            let item = this.searchCollection.find(ent => ent.searchGuid == $event.key);
            this.searchOptions = JSON.parse(item.criterias);
            this.teamGuid = this.searchOptions.teamGuid;
            this.teamFilterList = []; 
            this.teamFilterList = { "defaultValue": this.teamGuid, "listArray": this.teams };
            this.getPrograms();
        }
    }
    actionDropSelectedHandler = ($event) => {
        console.log($event)
    }

    retrieveSavedCriterias() {
        this.searchList = [];
        let url = '/assets/json/Home/RetrieveSearchCriterias.json';
        this._webapi.get(url, false).map(res => res.json()).subscribe(
            (data) => {
                if (data != null) {
                    let defitem = 0;
                    if (data) {
                        data = data.sort((n1, n2) => n1.searchType - n2.searchType);
                        this.searchCollection = data;
                        for (var element of data) {
                            let item = new KeyValuePairModel(element.searchGuid, element.searchName);
                            this.searchList.push(item);
                        }
                        defitem = this.searchList[0];
                        this.searchOptions = JSON.parse(data[0].criterias);
                        this.teamGuid = this.searchOptions.teamGuid;
                        console.log(this.searchOptions);
                        this.getPrograms();
                        if (this.searchList.length == 0) {
                            this.searchList.push(new KeyValuePairModel('-1', 'All'));
                        }
                    }
                    this.showList = { "defaultValue": defitem, "listArray": this.searchList };
                }
            }, (error) => { this._notify.error(error.text()); }, );
    }    

    onPortfolioFilterEvent = (filteredData: any) => {
        console.log('HomeComponent :: onPortfolioFilterEvent =>', filteredData);
        this.filteredPrograms = filteredData;
    }
}
