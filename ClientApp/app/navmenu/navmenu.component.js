"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
var core_1 = require("@angular/core");
var NavmenuComponent = /** @class */ (function () {
    //randomNum: number;
    function NavmenuComponent(_router, _init) {
        var _this = this;
        this._router = _router;
        this._init = _init;
        //isInRoles: boolean = false;
        this.isProduction = false;
        this.browseNavigation = function (event) {
            _this._router.navigate(['/browse', Math.floor(Math.random() * Math.floor(10000))]);
        };
        this.fullImagePath = './assets/images/xlcatlin.jpg';
        //this._router.events.subscribe((evt) => {
        //    if(evt instanceof NavigationStart) {
        //        this.randomNum = Math.floor(Math.random() * Math.floor(10000));
        //    }
        //});
    }
    NavmenuComponent.prototype.ngOnInit = function () {
        // this.resetDefaultMenustyle();
        //this.isInRoles = this._init.IsInRoles;
        this.isProduction = this._init.IsProduction;
    };
    NavmenuComponent = __decorate([
        core_1.Component({
            selector: 'xl-navmenu',
            templateUrl: './navmenu.component.html',
            styleUrls: ['./navmenu.component.less']
        })
    ], NavmenuComponent);
    return NavmenuComponent;
}());
exports.NavmenuComponent = NavmenuComponent;
