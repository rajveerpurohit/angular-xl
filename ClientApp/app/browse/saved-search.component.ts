import { Component, HostListener, Input, Output, EventEmitter } from '@angular/core';
import { WebApiService } from '../common/services/web-api.service';
import 'rxjs/add/operator/map';
import { Observable } from 'rxjs/Observable';
import { SavedSearch } from '../browse/models/browse.model';
import { InitialDataService } from '../common/services/initial-data.service';
import { Router, ActivatedRoute, ParamMap, NavigationEnd, NavigationStart } from '@angular/router';
import { FoolproofControlService } from '../common/services/foolproof-control.service';
import { NotificationService } from '../notification/notification.service';
import { RetrieveSerachCriterias } from './data/RetrieveSearchCriterias';

@Component({
    selector: 'saved-search',
    templateUrl: './saved-search.component.html',
    styleUrls: ['./saved-search.component.less']
})

export class SavedSearchComponent {
    @Output() savedCriteriachange = new EventEmitter<SavedSearch>();

    userSavedSearches = [];
    defaultSavedSearches = [];
    searchList: Array<SavedSearch> = [];
    selectedSavedSearch: SavedSearch;


    UserName: string;
    UserID: string;
    OtherList = [];

    savedDeleteitem = new SavedSearch();
    showDelete = false;
    saveHome = false;
    classBlack = "isBlack";
    src = "../../assets/SVG/Home Black.svg";
    //inputSelectedSavedSearchRowIndex: number;
    //usersearchrowindex: number; 
    public addingNewSearch() {
        this.selectedSavedSearch = new SavedSearch();
    }

    public saveSearch(searchName: string, searOptions: string) {
        this.selectedSavedSearch.criterias = searOptions;

        let searchID = this.selectedSavedSearch.searchGuid > 0 ? this.selectedSavedSearch.searchGuid : 0;

        let isSaveValid = true;

        if (searchID === 0) {
            if (searchName === '') {
                this._notify.warn("Please enter Search Name to Save Search.");
                return false;
            }
            let pattern = "^[A-Za-z0-9_.]+$";
            if (!(/[a-zA-Z0-9-_ ]/.test(searchName))) {
                isSaveValid = false;
            }
            for (let item = 0; item < this.searchList.length; item++) {
                if (this.searchList[item].searchName == searchName) {
                    isSaveValid = false;
                }
            }
            if (isSaveValid == false) {
                this._notify.warn("Search name exists.Please enter a new SearchName.");
                return false;
            }
        }
        if (isSaveValid && searchID === 0) {

            this.selectedSavedSearch.searchName = searchName;
            this.selectedSavedSearch.activeInd = true;
            this.selectedSavedSearch.orderId = this.userSavedSearches.length + 1;
            this.selectedSavedSearch.version = 0;

            let url = '/api/browse/SaveSearch';
            this._webapi.post(url, this.selectedSavedSearch).subscribe(
                (data) => {
                    this.retrieveSavedCriterias();
                    this._notify.success("The search is saved successfully.");
                },
                (err) => { this._notify.error(err.text()); }
            );
        }
        else if (isSaveValid && searchID > 0) {
            let url = '/api/browse/UpdateSearch';
            this._webapi.post(url, this.selectedSavedSearch).subscribe(
                (data) => {
                    console.info("OK");
                    this.retrieveSavedCriterias();
                    this._notify.success("The search is updated successfully.");
                },
                (err) => { this._notify.error(err.text()); }
            );
        }
        return true;
    }

    constructor(private _webapi: WebApiService, private _route: ActivatedRoute, private _router: Router, private _notify: NotificationService, private _fp: FoolproofControlService, private _initData: InitialDataService) {
    }

    ngOnInit() {
        this.UserName = this._initData.UserName;
        //this.UserID = this._initData.UserId; 
        this.retrieveSavedCriterias();
    }


    retrieveSavedCriterias() {
        this.userSavedSearches = [];
        this.defaultSavedSearches = [];
        this.searchList = [];
        let data = RetrieveSerachCriterias;
        // let url = '/api/browse/RetrieveSearchCriterias';
        // this._webapi.get(url, false).map(res => res.json()).subscribe(
        //   (data) => {
        if (data != null) {
            this.searchList = data;
            this.userSavedSearches = data.filter((val, index) => val.searchType == 2).sort((n1, n2) => n1.orderId - n2.orderId);
            this.defaultSavedSearches = data.filter((val, index) => val.searchType == 1).sort((n1, n2) => n1.orderId - n2.orderId);
        }
        // }, (error) => { this._notify.error(error.text()); }, );
    }

    onSavedSearchSelected = (item: any): void => {
        this._notify.clear();
        this.selectedSavedSearch = item;
        this.savedCriteriachange.emit(this.selectedSavedSearch);
    }

    doEditSearch(item) {
        this._notify.clear();
        this.selectedSavedSearch = item;
        this.selectedSavedSearch.isEdit = true;
        this.savedCriteriachange.emit(item);
    }


    showDeleteConfirm(item) {
        this._notify.clear();
        this.savedDeleteitem = new SavedSearch();
        this.savedDeleteitem = item;
        this.showDelete = true;
    }

    //Lavanya
    doDeleteSearch() {
        //delet this.selectedSavedSearch from db
        let item = this.savedDeleteitem;
        item.activeInd = false;
        this.showDelete = false;
        this.deleteSavedSearch(item);
    }

    deleteSavedSearch(item: SavedSearch) {
        let url = '/api/browse/DeleteSearch?searchGuid=' + item.searchGuid;
        this._webapi.get(url).map(res => res.json()).subscribe(
            (data) => {
                this._notify.success("The search is successfully deleted.");
                this.retrieveSavedCriterias();
                this.savedCriteriachange.emit(item);
            }, (error) => { this._notify.error("Error deleting the search.") }, );
    }

    cancel() {
        this.savedDeleteitem = new SavedSearch();
        this.showDelete = false;
    }

    onReorderCompleted = (item, newOrderId): void => {
        let url = '/api/browse/ReorderSavedSearch?newOrder=' + newOrderId;
        this._webapi.post(url, item).map(res => res.json()).subscribe(
            (data) => {
                if (data != null) {
                    this.searchList = data;
                    this.userSavedSearches = data.filter((val, index) => val.searchType == 2).sort((n1, n2) => n1.orderId - n2.orderId);
                    this.defaultSavedSearches = data.filter((val, index) => val.searchType == 1).sort((n1, n2) => n1.orderId - n2.orderId);
                }
            }, (error) => this._notify.error(error.text()));
    }

    setHomeScreen = (item, e): void => {
        this.saveHome = true;
        // item.setHomeScreen = item.setHomeScreen ? item.setHomeScreen = false : item.setHomeScreen = true;
        // const selectNode = document.getElementsByClassName('is-green');
        // const homeGreen = document.getElementById("homeGreen"); 
        // console.log("homeGreen", homeGreen);
        // homeGreen.nextElementSibling.remove;
        // console.log("selectNode", selectNode);
        // if (selectNode[0] && selectNode[0].classList.contains('is-green')) {
        //     selectNode[0].classList.remove('is-green');
        // }
        // console.log(item.setHomeScreen,"item.setHomeScreen");
        // this.src = "../../assets/SVG/Home Black.svg";
        // console.log(item.src, "before");
        const selectNode = document.getElementsByClassName('isGreen');
        console.log(selectNode[0], "SELECTNODE"); 
        if (selectNode[0] && selectNode[0].classList.contains('isGreen')) {
            selectNode[0].setAttribute('src', '../../assets/SVG/Home Black.svg');
            selectNode[0].classList.remove('isGreen');
        }
        // console.log(item, "Item");
        // this.src = "../../assets/SVG/Home Black.svg";
        // console.log(e.target['ng-reflect-ng-class'], "Event");
        e.target.src = this.saveHome ? "../../assets/SVG/Home Green.svg" : "../../assets/SVG/Home Black.svg";
        e.target.className = this.saveHome ? "isGreen" : "isBlack";
        // console.log(item.src, "after");
    }
}