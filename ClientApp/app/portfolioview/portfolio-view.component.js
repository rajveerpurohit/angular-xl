"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
var core_1 = require("@angular/core");
var PortfolioViewComponent = /** @class */ (function () {
    function PortfolioViewComponent(_webapi, _initData, _route, _router, _utility) {
        var _this = this;
        this._webapi = _webapi;
        this._initData = _initData;
        this._route = _route;
        this._router = _router;
        this._utility = _utility;
        this.sortby = "";
        this.datasource = [];
        this.showRefineCriteriaMsg = false;
        this.selectedIndex = '';
        this.baseUrl = this._initData.BaseUrl;
        this.userAllCompanies = [];
        this.userWritableCompanies = [];
        this.GenerateExcelUrl = '';
        this.renew = function (progamNum) {
            _this._router.navigate(['/renewsubmission', progamNum]);
        };
        this.goToProgramDetail = function (pgm) {
            _this._initData.programDetailsRenewFlags = { programNumber: pgm.programNumber, isReadyForRenewal: pgm.isReadyForRenewal, isRenewed: pgm.isRenewed };
            if (_this.isUserReadable(pgm.companyGuid)) {
                _this._router.navigate(['/programdetails', pgm.programNumber, 'false', pgm.programTitle != null ? pgm.programTitle : ""]);
            }
        };
        this.isUserReadable = function (companyGuid) {
            if (_this.isUwReadOnlyUser)
                return true;
            else
                return _this.userAllCompanies.findIndex(function (ent) { return ent.companyGUID == companyGuid; }) > -1;
        };
        this.isUserWritable = function (companyGuid) {
            return _this.userWritableCompanies.findIndex(function (ent) { return ent.companyGUID == companyGuid; }) > -1;
        };
        this.openNewTab = function (pgm) {
            var baseUrl = _this.baseUrl.length > 0 ? "/" + _this.baseUrl + "/#/" : "/#/";
            var programdetails = "programdetails/" + pgm.programNumber + "/" + pgm.isReadyForRenewal + "/" + pgm.isRenewed + "/" + _this._utility.EncodeToBase64Unicode(pgm.programTitle);
            var url = window.location.origin + baseUrl + programdetails;
            window.open(url, '_blank');
        };
        this.userWritableCompanies = this._initData.UserCompanies;
        this.userAllCompanies = this._initData.UserAllCompanies;
        this.isUwReadOnlyUser = (this._initData.IsUnderwriter || this._initData.IsActuary);
        this.shareProgramUrl = this._webapi.getFinalUrl('/api/program/ShareProgramDetails');
        document.addEventListener('click', this.offClickHandler.bind(this));
    }
    PortfolioViewComponent.prototype.ngOnInit = function () {
    };
    PortfolioViewComponent.prototype.ngOnChanges = function (changes) {
    };
    PortfolioViewComponent.prototype.showActionDropDown = function (event, index) {
        console.log("index", index);
        this.selectedIndex = index;
        var parentNode = event.currentTarget.parentNode;
        var activeNode = document.querySelectorAll('.action-drop.is-active');
        if (parentNode.querySelector('.action-drop').classList.contains("is-active")) {
            //the same node is closed
            this.selectedIndex = '';
            parentNode.querySelector('.action-drop').classList.remove('is-active');
        }
        else if (activeNode.length !== 0 && activeNode[0].classList.contains("is-active")) {
            // while other node is opened except own 
            this.selectedIndex = index;
            activeNode[0].classList.remove('is-active');
            parentNode.querySelector('.action-drop').classList.add('is-active');
        }
        else {
            // while no active class is present
            this.selectedIndex = index;
            parentNode.querySelector('.action-drop').classList.add('is-active');
        }
    };
    PortfolioViewComponent.prototype.offClickHandler = function (event) {
        if (!event.target.closest(".listing-table__row-actions")) {
            var activeNode = document.querySelectorAll('.action-drop.is-active');
            if (activeNode.length !== 0 && activeNode[0].classList.contains("is-active")) {
                // while other node is opened except own 
                activeNode[0].classList.remove('is-active');
                this.selectedIndex = '';
            }
        }
    };
    __decorate([
        core_1.Input()
    ], PortfolioViewComponent.prototype, "sortby");
    __decorate([
        core_1.Input()
    ], PortfolioViewComponent.prototype, "datasource");
    __decorate([
        core_1.Input()
    ], PortfolioViewComponent.prototype, "showRefineCriteriaMsg");
    PortfolioViewComponent = __decorate([
        core_1.Component({
            selector: 'rwb-portfolio-view',
            templateUrl: './portfolio-view.component.html',
            styleUrls: ['./portfolio-view.component.less']
        })
    ], PortfolioViewComponent);
    return PortfolioViewComponent;
}());
exports.PortfolioViewComponent = PortfolioViewComponent;
