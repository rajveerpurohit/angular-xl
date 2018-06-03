"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
var core_1 = require("@angular/core");
var router_1 = require("@angular/router");
var TimerObservable_1 = require("rxjs/observable/TimerObservable");
require("rxjs/add/operator/startWith");
require("rxjs/add/operator/map");
var key_value_pair_model_1 = require("../common/models/key-value-pair.model");
var browse_model_1 = require("../browse/models/browse.model");
var HomeComponent = /** @class */ (function () {
    function HomeComponent(_webapi, _route, _router, _fp, _initData, _notify) {
        // override the route reuse strategy
        var _this = this;
        this._webapi = _webapi;
        this._route = _route;
        this._router = _router;
        this._fp = _fp;
        this._initData = _initData;
        this._notify = _notify;
        this._teamGuid = -1;
        this.viewType = 1;
        this.programCount = 0;
        this.teams = [];
        this.searchList = [];
        this.getPrograms = function () {
            _this.programs = [];
            var url = '/assets/json/Home/PortfolioData.json';
            _this._webapi.get(url).map(function (res) { return res.json(); }).subscribe(function (data) {
                _this.programs = data;
                if (_this.programs) {
                    _this.programCount = _this.programs.length;
                    if (_this.programCount >= 200) {
                        _this._notify.warn("The screen is configured to display a maximum of 200 programs");
                    }
                }
            }, function (err) { return console.log(err.text()); });
        };
        this.filterSelectedHandler = function (event) {
            // this will give the selected option for further use        
            _this.teamGuid = event;
            if (_this.teamGuid.key == '0') {
                _this.viewType = 1;
            }
            else {
                _this.viewType = 2;
            }
            _this.searchOptions.teamGuid = _this.teamGuid.key;
            _this.getPrograms();
        };
        this.showSelectedHandler = function ($event) {
            if (_this.searchCollection != null) {
                var item = _this.searchCollection.find(function (ent) { return ent.searchGuid == $event.key; });
                _this.searchOptions = JSON.parse(item.criterias);
                _this.teamGuid = _this.searchOptions.teamGuid;
                _this.teamFilterList = [];
                _this.teamFilterList = { "defaultValue": _this.teamGuid, "listArray": _this.teams };
                _this.getPrograms();
            }
        };
        this.actionDropSelectedHandler = function ($event) {
            console.log($event);
        };
        this._router.routeReuseStrategy.shouldReuseRoute = function () {
            return false;
        };
        this._router.events.subscribe(function (evt) {
            if (evt instanceof router_1.NavigationEnd) {
                //document.getElementsByTagName("body")[0].className = "";
            }
            else if (evt instanceof router_1.NavigationStart) {
                _this.subscription.unsubscribe();
            }
        });
    }
    HomeComponent.prototype.ngOnInit = function () {
        this.searchOptions = new browse_model_1.SearchOptions();
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
    };
    HomeComponent.prototype.ngOnDestroy = function () {
        //avoid memory leakage
        this.subscription.unsubscribe();
    };
    HomeComponent.prototype.ngAfterViewInit = function () {
        var _this = this;
        this.teamOptions.changes.subscribe(function (t) {
            _this._fp.InitDropdown();
        });
    };
    HomeComponent.prototype.autoRefresh = function () {
        var _this = this;
        //one miniute is equal to 60000
        var timer = TimerObservable_1.TimerObservable.create(300000, 300000);
        this.subscription = timer.subscribe(function (t) { return _this.getPrograms(); });
    };
    HomeComponent.prototype.getTeamOptions = function () {
        var _this = this;
        this._webapi.get('/assets/json/Home/teams.json').map(function (res) { return res.json(); }).subscribe(function (data) {
            if (_this._initData.IsUnderwriter) {
                _this.teamGuid = new key_value_pair_model_1.KeyValuePairModel('0', 'My View');
                _this.teams.push(_this.teamGuid);
            }
            if (data) {
                for (var _i = 0, data_1 = data; _i < data_1.length; _i++) {
                    var d = data_1[_i];
                    var item = new key_value_pair_model_1.KeyValuePairModel(d.teamGuid, d.teamGuid > 0 ? 'Team -- ' + d.name : d.name);
                    _this.teams.push(item);
                }
                if (_this.teamGuid == null) {
                    _this.teamGuid = _this.teams[0];
                }
                console.log(_this.searchOptions.teamGuid);
            }
            if (_this.teams.length == 0) {
                _this.teams.push(new key_value_pair_model_1.KeyValuePairModel('-1', 'All'));
            }
            _this.teamFilterList = { "defaultValue": _this.teamGuid, "listArray": _this.teams };
        }, function (err) { return console.log(err); });
    };
    ;
    HomeComponent.prototype.exceldownlad = function () {
        if (this.programCount > 0) {
            if (this.programCount > 0) {
                var url = '/api/portfolio/ExportPrograms';
                this._webapi.downloadExcelByPost(url, this.searchOptions, "report.xlsx");
            }
        }
    };
    HomeComponent.prototype.retrieveSavedCriterias = function () {
        var _this = this;
        this.searchList = [];
        var url = '/assets/json/Home/RetrieveSearchCriterias.json';
        this._webapi.get(url, false).map(function (res) { return res.json(); }).subscribe(function (data) {
            if (data != null) {
                var defitem = 0;
                if (data) {
                    data = data.sort(function (n1, n2) { return n1.searchType - n2.searchType; });
                    _this.searchCollection = data;
                    for (var _i = 0, data_2 = data; _i < data_2.length; _i++) {
                        var element = data_2[_i];
                        var item = new key_value_pair_model_1.KeyValuePairModel(element.searchGuid, element.searchName);
                        _this.searchList.push(item);
                    }
                    defitem = _this.searchList[0];
                    _this.searchOptions = JSON.parse(data[0].criterias);
                    _this.teamGuid = _this.searchOptions.teamGuid;
                    console.log(_this.searchOptions);
                    _this.getPrograms();
                    if (_this.searchList.length == 0) {
                        _this.searchList.push(new key_value_pair_model_1.KeyValuePairModel('-1', 'All'));
                    }
                }
                _this.showList = { "defaultValue": defitem, "listArray": _this.searchList };
            }
        }, function (error) { _this._notify.error(error.text()); });
    };
    __decorate([
        core_1.Input()
    ], HomeComponent.prototype, "programType");
    __decorate([
        core_1.Input()
    ], HomeComponent.prototype, "programTypeName");
    __decorate([
        core_1.Input()
    ], HomeComponent.prototype, "IsNew");
    __decorate([
        core_1.ViewChildren('teamOptions')
    ], HomeComponent.prototype, "teamOptions");
    HomeComponent = __decorate([
        core_1.Component({
            selector: 'uwwb-home',
            templateUrl: './home.component.html',
            styleUrls: ['./home.component.less']
        })
    ], HomeComponent);
    return HomeComponent;
}());
exports.HomeComponent = HomeComponent;
