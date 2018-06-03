import { Component, OnInit, Input,ViewChild, ElementRef, OnChanges, SimpleChanges, Output, EventEmitter, HostListener } from '@angular/core';
import { Router, ActivatedRoute, ParamMap, NavigationEnd, NavigationStart } from '@angular/router';
import { InitialDataService } from '../common/services/initial-data.service';
import { WebApiService } from '../common/services/web-api.service';
import { DefaultSorterComponent } from '../common/components/default-sorter.component';
import { UtilityService } from '../common/services/utility.service';

@Component({
    selector: 'rwb-portfolio-view',
    templateUrl: './portfolio-view.component.html',
    styleUrls: ['./portfolio-view.component.less']
})
export class PortfolioViewComponent implements OnInit, OnChanges {
    @Input() sortby = "";
    @Input() datasource = [];
    @Input() filteredDatasource = [];
    @Input() showRefineCriteriaMsg = false;
    @Output() filterCriteria = new EventEmitter<any>();
    selectedIndex: any = '';

    private baseUrl: string = this._initData.BaseUrl;
    popovershow: boolean = false;
    filteredData = [];
    filterControlPosition = 0;
    userAllCompanies = [];
    userWritableCompanies = [];
    shareProgramUrl: string;
    GenerateExcelUrl: string = '';
    filterColumn: string = null;
    isUwReadOnlyUser: boolean;
    savedFilters = [];
    currentFilter = {};
    constructor(private _webapi: WebApiService, private _initData: InitialDataService, private _route: ActivatedRoute, private _router: Router, private _utility: UtilityService, private elementRef: ElementRef) {
        this.userWritableCompanies = this._initData.UserCompanies;
        this.userAllCompanies = this._initData.UserAllCompanies;
        this.isUwReadOnlyUser = (this._initData.IsUnderwriter || this._initData.IsActuary);
        this.shareProgramUrl = this._webapi.getFinalUrl('/api/program/ShareProgramDetails');
        document.addEventListener('click', this.offClickHandler.bind(this));
    }

    ngOnInit() {
    }

    ngOnChanges(changes: SimpleChanges) {

    }

    renew = (progamNum: string): void => {
        this._router.navigate(['/renewsubmission', progamNum]);
    }

    showPopover(element: any, filterColumn: string) {
        let exist = false;
        if (filterColumn) {
            this.filterColumn = filterColumn;
        }
        this.savedFilters.forEach((filter) => {
                if(Object.keys(filter)[0] === filterColumn) {
                    exist = true;
                    this.currentFilter = filter;
                }
            });
        if (!exist) {       
            let filterCriteria = {[filterColumn]: ''};
            this.savedFilters.push(filterCriteria);
            this.currentFilter = filterCriteria;
        }
        this.togglePopover();
        this.filteredData = [];
        this.filterControlPosition = element.clientX;
    }

    togglePopover  =  ()  =>  {
        if (!this.popovershow) {
            this.popovershow  =  !this.popovershow;
        } else {
            const txtSearchName = this.elementRef.nativeElement.querySelector('#txtSearchName');
            txtSearchName.value = '';
            if (this.currentFilter[this.filterColumn] === '') {
                this.disableClearFilter();
            } else if (this.currentFilter[this.filterColumn]) {
                this.enableClearFilter();
                txtSearchName.value = this.currentFilter[this.filterColumn];
            }
            this.popovershow  =  this.popovershow;
        }
    }
    disableClearFilter = () => {
         (<HTMLElement>document.querySelector(".clearLink")).style.cursor = "cursor";
        (<HTMLElement>document.querySelector(".clearLink")).style.pointerEvents = "none";
        (<HTMLElement>document.querySelector(".clearLink")).style.color = "#484848";
    }
    cancelPopover = () => {
        this.popovershow  =  !this.popovershow;
    } 
    
    clearfiltter = (pgms: any): void =>{
        this.currentFilter[this.filterColumn] = '';
        this.filteredData = [];
        this.filteredDatasource = pgms;
        this.cancelPopover();
    } 

    goToProgramDetail = (pgm: any): void => {
        this._initData.programDetailsRenewFlags = { programNumber: pgm.programNumber, isReadyForRenewal: pgm.isReadyForRenewal, isRenewed: pgm.isRenewed };
        if (this.isUserReadable(pgm.companyGuid)) {
            this._router.navigate(['/programdetails', pgm.programNumber, 'false', pgm.programTitle != null ? pgm.programTitle : ""]);
        }
    }

    onFilterSelction = (pgm: any): void => {
        if (this.filteredData) {
            if (pgm) {
                // send single element
                this.filteredData = [];
                this.filteredData.push(pgm);
            }
            this.filterCriteria.emit(this.filteredData);
            this.filteredData = [];
            this.cancelPopover();
        }
    }

    onFilterChange = (event, pgms: any): void => {
        let txt = event.target.value.toLowerCase();
        this.currentFilter[this.filterColumn] = txt;
        this.filteredData = [];
        pgms.forEach((pgm) => {
            if(pgm[this.filterColumn].toLowerCase().indexOf(txt) >=0) {
                this.filteredData.push(pgm);
            } 
        });
        if(event.which === 13) {
            this.onFilterSelction(null);
        }
	    if(this.currentFilter[this.filterColumn]) {
           this.enableClearFilter();
        }
    }

    enableClearFilter = () => {
        (<HTMLElement>document.querySelector(".clearLink")).style.cursor = "hand";
        (<HTMLElement>document.querySelector(".clearLink")).style.pointerEvents = "auto";
        (<HTMLElement>document.querySelector(".clearLink")).style.color = "#21409A";
    }

    isUserReadable = (companyGuid: any): boolean => {
        if (this.isUwReadOnlyUser)
            return true;
        else
            return this.userAllCompanies.findIndex(ent => ent.companyGUID == companyGuid) > -1
    }

    isUserWritable = (companyGuid: any): boolean => {
        return this.userWritableCompanies.findIndex(ent => ent.companyGUID == companyGuid) > -1
    }

    openNewTab = (pgm: any): void => {
        let baseUrl = this.baseUrl.length > 0 ? "/" + this.baseUrl + "/#/" : "/#/";
        var programdetails = "programdetails/" + pgm.programNumber + "/" + pgm.isReadyForRenewal + "/" + pgm.isRenewed + "/" + this._utility.EncodeToBase64Unicode(pgm.programTitle);
        var url = window.location.origin + baseUrl + programdetails;
        window.open(url, '_blank');
    }

    showActionDropDown(event, index) {
        this.selectedIndex = index;
        const parentNode = event.currentTarget.parentNode;
        const activeNode = document.querySelectorAll('.action-drop.is-active');
        if (parentNode.querySelector('.action-drop').classList.contains("is-active")) {
            //the same node is closed
            this.selectedIndex = '';
            parentNode.querySelector('.action-drop').classList.remove('is-active');
        } else if (activeNode.length !== 0 && activeNode[0].classList.contains("is-active")) {
            // while other node is opened except own 
            this.selectedIndex = index;
            activeNode[0].classList.remove('is-active');
            parentNode.querySelector('.action-drop').classList.add('is-active');
        } else {
            // while no active class is present
            this.selectedIndex = index;
            parentNode.querySelector('.action-drop').classList.add('is-active');
        }
    }

    offClickHandler(event: any) {
        if (!event.target.closest(".listing-table__row-actions")) {
            const activeNode = document.querySelectorAll('.action-drop.is-active');
            if (activeNode.length !== 0 && activeNode[0].classList.contains("is-active")) {
                // while other node is opened except own 
                activeNode[0].classList.remove('is-active');
                this.selectedIndex = '';
            }
        }
    }

    ngAfterViewInit() {
        this.setElementHeight();
       
    }

    setElementHeight() {
        var height = window.innerHeight;
        var tbodyheight = height - 213;
        var tableheight = tbodyheight + 110;

        document.querySelector('tbody').style.height = tbodyheight.toString() + 'px';
        (<HTMLElement>document.querySelector("#homeTable")).style.height = "100%";
    };
}
