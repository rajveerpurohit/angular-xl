import { Component, OnInit, AfterViewInit, Input, Output, EventEmitter, QueryList, ViewChild, HostListener } from '@angular/core';
import { Router, ActivatedRoute, ParamMap, NavigationEnd, NavigationStart } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/startWith';
import 'rxjs/add/operator/map';
import 'rxjs/Rx';
import { WebApiService } from '../common/services/web-api.service';
import { SearchCriteria, SearchOptions, SavedSearch } from '../browse/models/browse.model';
import { FoolproofControlService } from '../common/services/foolproof-control.service';
import { KeyValuePairModel } from '../common/models/key-value-pair.model';
import { InitialDataService } from '../common/services/initial-data.service';
import { FormGroup, FormArray, FormBuilder, Validators } from '@angular/forms';
import { DefaultSorterComponent } from '../common/components/default-sorter.component';
import { NotificationService } from '../notification/notification.service';
import { SavedSearchComponent } from './saved-search.component';
import { BrokersDistinct } from './data/BrokersDistinct';
import { CedantsDistinct } from './data/CedantsDistinct';
import { GetallTeams } from './data/GetallTeams';
import { GetCedentGroup } from './data/GetCedentGroup';
import { GetPlanningLOB } from './data/GetPlanningLOB';
import { UnderwritersDistincts } from './data/UnderwritersDistinct';
import { XLeRateCompaniesDistinct } from './data/XLeRateCompaniesDistinct';
import { DestinyProgramTitleNumbers } from './data/DestinyProgramTitleNumbers';
import { RetrieveAllDestinyContractStatus } from './data/RetrieveAllDestinyContractStatus';
import { PortfolioData } from './data/PortfolioData';
@Component({
    selector: 'uwwb-browse',
    templateUrl: './browse.component.html',
    styleUrls: ['./browse.component.less']
})
export class BrowseComponent implements OnInit, AfterViewInit {

    @ViewChild(SavedSearchComponent)
    private savedSearchCtrl: SavedSearchComponent;

    teams = [];
    CedantsDistinct = [];
    UnderwritersDistinct = [];
    BrokersDistinct = [];
    PLOBDistinct = [];
    DestinyProgramTitleNumbers = [];
    XLeRateCompaniesDistinct = [];
    CedantGroupData = [];
    DestinyContractStatus = [];
    TeamList = [];

    programs: any[];
    gridDataSource: any[];
    searchOptions: SearchOptions;

    programCount: number = 0;
    ParameterText: string = '';
    rowCountPerPage = 10;
    pageIndex = 0;
    showGridView = true;
    currentTabIndex: number = 1;

    criteriaType: string = 'Cedant';
    criteriaTypeText: string = 'Cedant';
    simpleSearchCriteriaText: string = '';

    myAutoCompleteElement: any;
    myDynamicAutoCompleteElement = [];

    isEditSearch = false;
    showSaveSearchDialog = false;

    controlID: string = '';
    dynamicID = 0;
    public myForm: FormGroup;
    searchname: string = '';
    //isTeamSearch = false;

    initScreenData() {
        this.criteriaType = 'Cedant';
        this.criteriaTypeText = 'Cedant';
        //this.criteriaValue = "";
        this.simpleSearchCriteriaText = "";
        this.programs = [];
        this.gridDataSource = [];
        this.ParameterText = '';
        this.programCount = 0;
        this.searchOptions = new SearchOptions();
        this.searchOptions.teamGuid = -1;
        this.searchOptions.operator = 'AND';
        this.searchOptions.sortBy = 'CedantName';
        this.searchOptions.isBoundOnly = true;
        this.searchOptions.programType = 5;
        this.searchname = '';
        if (!(this.currentTabIndex === 2)) { this.myForm = null; }
        this.isEditSearch = false;
    }

    constructor(private _webapi: WebApiService, private _route: ActivatedRoute, private _router: Router
        , private _notify: NotificationService
        , private _fp: FoolproofControlService
        , private _initData: InitialDataService
        , private _fb: FormBuilder) {

        this._router.routeReuseStrategy.shouldReuseRoute = function () {
            return false;
        }
    }

    ngOnInit() {
        this.initScreenData();

        //this.getTeamOptions();

        //this.loadCriteriaData(this.criteriaType);
    }

    onSearchTabClick = (searchTab: number): boolean => {




        this._notify.clear();

        this._fp.Tabbed.setActive("browseSearchTab", "search-tab-"+searchTab);


        if (searchTab == 1 || searchTab == 2 || (searchTab == 3 && this.isEditSearch)) { this.savedSearchCtrl.addingNewSearch(); }

        this.initScreenData();
        this.currentTabIndex = searchTab;
        if (searchTab == 2) {
            this.searchOptions.programType = 0;
            this.searchOptions.isBoundOnly = false;
            this.myForm = this._fb.group({
                Criterias: this._fb.array([
                    this.initCriterias(this.criteriaType, '', ''), this.initCriterias(this.criteriaType, '', '')
                ])
            });
            for (var itemIndex = 0; itemIndex <= 1; itemIndex++) {
                this.dynamicID = itemIndex;
                this.controlID = "txt-search-programs" + itemIndex;
                this.loadCriteriaData(this.criteriaType, itemIndex);
            }
        }


        return false;
    }

    initCriterias(criteriaType: string, criteriaText: string, criteriaTypeText: string) {
        return this._fb.group({
            CriteriaType: [criteriaType, Validators.required],
            CriteriaText: [criteriaText],
            CriteriaTypeText: [criteriaTypeText]
        });
    }

    addCriteria(criteriaType: string, criteriaText: string, criteriaTypeText: string) {
        const control = <FormArray>this.myForm.controls['Criterias'];
        control.push(this.initCriterias(criteriaType, criteriaText, criteriaTypeText));
        this.loadCriteriaData(criteriaType, (control.length - 1));
    }

    removeCriteria(i: number) {
        const control = <FormArray>this.myForm.controls['Criterias'];
        control.removeAt(i);
        if (this.myDynamicAutoCompleteElement != null && this.myDynamicAutoCompleteElement.length > 0 && this.myDynamicAutoCompleteElement[i] != null) {
            this.myDynamicAutoCompleteElement[i].destroy();
            this.myDynamicAutoCompleteElement[i] = null;
        }
    }

    ngAfterViewInit() {
        // this._fp.Tabbed.InitTabbed();
    }

    clearTypeaheadControl() {
        var options = [];
        if (this.currentTabIndex == 1) {
            if (this.myAutoCompleteElement != null) {
                this.myAutoCompleteElement.destroy();
            }
            // this.myAutoCompleteElement = this._fp.autoComplete("txt-search-programs", options, null);
        }
        else if (this.currentTabIndex == 2) {
            let controlItemName = this.controlID;
            let controlItemId = this.dynamicID;
            if (this.myDynamicAutoCompleteElement != null && this.myDynamicAutoCompleteElement.length > 0 && this.myDynamicAutoCompleteElement[controlItemId] != null) {
                this.myDynamicAutoCompleteElement[controlItemId].destroy();
                this.myDynamicAutoCompleteElement[controlItemId] = null;
            }
        }
    }

    //init underwriter, company, broker, cedant autocomplete controls
    // initAutoComplete(url: string, options: any[], keyName: string, valueName: string, controlId: number, isStartWithSearch = true) {
    //     if (options == null || options.length == 0) {
    //         this.clearTypeaheadControl();
    //         this._webapi.get(url).map(res => res.json()).subscribe(
    //             (data) => {
    //                 if (data) {
    //                     for (var d of data) {
    //                         let item = [d[keyName], d[valueName]];
    //                         options.push(item);
    //                     }
    //                 }
    //             },
    //             (err) => console.log(err),
    //             () => {
    //                 this.initAutoCompleteControl(options, isStartWithSearch, controlId);
    //             }
    //         );
    //     } else {
    //         this.initAutoCompleteControl(options, isStartWithSearch, controlId);
    //     }
    // };
    initAutoComplete(data: any, options: any[], keyName: string, valueName: string, controlId: number, isStartWithSearch = true) {
        if (options == null || options.length == 0) {
            this.clearTypeaheadControl();
            if (data) {
                for (var d of data) {
                    let item = [d[keyName], d[valueName]];
                    options.push(item);
                }
            }
            else {
                this.initAutoCompleteControl(options, isStartWithSearch, controlId);
            }
        } else {
            this.initAutoCompleteControl(options, isStartWithSearch, controlId);
        }
    };

    initAutoCompleteControl(options: any[], isStartWithSearch = true, controlId: number) {
        if (this.currentTabIndex == 1) {
            if (this.myAutoCompleteElement != null)
                this.myAutoCompleteElement.destroy();

            // this.myAutoCompleteElement = this._fp.autoComplete("txt-search-programs", options, this.onFilteredChangeEvent, isStartWithSearch);
        }
        else if (this.currentTabIndex == 2) {

            let controlItemId = controlId != null ? controlId : this.dynamicID;
            let controlItemName = "txt-search-programs" + controlItemId;

            if (this.myDynamicAutoCompleteElement != null && this.myDynamicAutoCompleteElement.length > 0 && this.myDynamicAutoCompleteElement[controlItemId] != null) {
                this.myDynamicAutoCompleteElement[controlItemId].destroy();
                this.myDynamicAutoCompleteElement[controlItemId] = null;
            }

            var selectElement = document.getElementById(controlItemName);
            if (selectElement != null) {
                // this.myDynamicAutoCompleteElement[controlItemId] = this._fp.autoComplete(controlItemName, options, this.onDynamicfilteredChangeEvent, isStartWithSearch);
            } else {
                setTimeout(() => {
                    // this.myDynamicAutoCompleteElement[controlItemId] = this._fp.autoComplete(controlItemName, options, this.onDynamicfilteredChangeEvent, isStartWithSearch);
                }, 500);
            }
        }
    }


    getTeamOptions() {
        this._webapi.get('/api/ReferenceData/Teams/').map(res => res.json()).subscribe(
            (data) => {
                if (data) {
                    this.teams = this.teams.concat(data);
                }
                if (this._initData.IsUnderwriter) {
                    this.teams.push({ 'teamGuid': 0, 'name': 'My View' });
                }
                else if (data != null && data.length > 0) {
                    this.searchOptions.teamGuid = data[0].teamGuid;
                }
                this.teams.push({ 'teamGuid': -1, 'name': 'All' });
                this.searchOptions.teamGuid = -1;
            },
            (err) => this._notify.error("Failed to load displaying optinos")
        );
    };

    onTeamChange = (val): void => {
        this._notify.clear();
        this.searchOptions.teamGuid = val;
        let criterias = this.searchOptions.criterias;
        if ((this.currentTabIndex == 3) && ((criterias && (criterias.length > 0)) || (this.searchOptions.programType > 0))) {
            this.searchFromServer();
            //return;
        }
        else if (this.currentTabIndex == 2 || this.currentTabIndex == 1) {
            //this.isTeamSearch = true;
            this.doSearch();
            //this.isTeamSearch = false;
            //return;
        }
        //else if (this.currentTabIndex == 3) {
        //    this._notify.warn("Please select search criteria");
        //    return;
        //}
    }

    onDynamicfilteredChangeEvent = (value: string, text: string): void => {
        const control = (<FormArray>this.myForm.controls['Criterias']).at(this.dynamicID);
        control.patchValue({ 'CriteriaText': text });
    }

    onTextBoxCriteriaFocus = (event: any, id: number): void => {
        this.dynamicID = id;
    }

    setProgramType(event) {
        this.searchOptions.programType = event.currentTarget.value;
    }

    setSortProp(event) {
        this.searchOptions.sortBy = event.currentTarget.value;
    }

    setCriteriaOperator(val) {
        this.searchOptions.operator = val;
    }

    onSimpleSearchTypeChange(event) {
        var val = event.currentTarget.value;
        this.criteriaType = val;
        this.criteriaTypeText = event.currentTarget.selectedOptions[0].text;
        this.simpleSearchCriteriaText = "";
        this.loadCriteriaData(val);
    }

    onAdvancedSearchTypeChange(event, id) {
        var type = event.currentTarget.value;
        this.dynamicID = id;
        this.controlID = "txt-search-programs" + id;
        var control = (<FormArray>this.myForm.controls['Criterias']).at(this.dynamicID);
        if (control) {
            control.patchValue({ 'CriteriaText': "", 'CriteriaTypeText': event.currentTarget.selectedOptions[0].text, 'CriteriaType': type });
        }
        this.loadCriteriaData(type);
    }

    loadCriteriaData = (criteriaTypeParam, controlId?: number): void => {
        switch (criteriaTypeParam) {
            case "Cedant": {
                this.initAutoComplete(CedantsDistinct, this.CedantsDistinct, "value", "key", controlId, false);
                break;
            }
            case "UW": {
                this.initAutoComplete(UnderwritersDistincts, this.UnderwritersDistinct, "value", "key", controlId);
                break;
            }
            case "Broker": {
                this.initAutoComplete(BrokersDistinct, this.BrokersDistinct, "value", "key", controlId, false);
                break;
            }
            case "PLOB": {
                this.initAutoComplete(GetPlanningLOB, this.PLOBDistinct, "value", "key", controlId);
                break;
            }
            case "ProgramTitle": {
                this.initAutoComplete(DestinyProgramTitleNumbers, this.DestinyProgramTitleNumbers, "value", "key", controlId, false);
                break;
            }
            case "OBU": {
                this.initAutoComplete(XLeRateCompaniesDistinct, this.XLeRateCompaniesDistinct, "value", "key", controlId);
                break;
            }
            case "CedantGroup": {
                this.initAutoComplete(GetCedentGroup, this.CedantGroupData, "value", "key", controlId);
                break;
            }
            case "DestinyContractStatus": {
                this.initAutoComplete(RetrieveAllDestinyContractStatus, this.DestinyContractStatus, "value", "key", controlId);
                break;
            }
            case "Team": {
                this.initAutoComplete(GetallTeams, this.TeamList, "value", "key", controlId);
                break;
            }
            default: {
                this.clearTypeaheadControl();
                break;
            }
        }
    }

    isValidText = (inputtext, list, iswildsearch): boolean => {
        for (let i = 0; i < list.length; i++) {
            var index = list[i][1].toUpperCase().search(inputtext.toUpperCase().trim());
            if ((iswildsearch && index > -1) || (!iswildsearch && index == 0)) {
                return true;
            }
        }
        return false;
    }

    validateCriteria = (type: string, text: any): boolean => {
        let typeaheadDistinct = [];
        let isWildSearch = true;
        switch (type) {
            case "Cedant": {
                typeaheadDistinct = this.CedantsDistinct;
                break;
            }
            case "Broker": {
                typeaheadDistinct = this.BrokersDistinct;
                break;
            }
            case "ProgramTitle": {
                typeaheadDistinct = this.DestinyProgramTitleNumbers;
                break;
            }
            case "UW": {
                typeaheadDistinct = this.UnderwritersDistinct;
                isWildSearch = false;
                break;
            }
            case "OBU": {
                typeaheadDistinct = this.XLeRateCompaniesDistinct;
                isWildSearch = false;
                break;
            }
            case "PLOB": {
                typeaheadDistinct = this.PLOBDistinct;
                isWildSearch = false;
                break;
            }
            case "CedantGroup": {
                typeaheadDistinct = this.CedantGroupData;
                break;
            }
            case "DestinyContractStatus": {
                typeaheadDistinct = this.DestinyContractStatus;
                isWildSearch = false;
                break;
            }
            case "Team": {
                typeaheadDistinct = this.TeamList;
                isWildSearch = false;
                break;
            }
            case "UWYear": {
                return (text >= 1000 && text <= 9999);
            }
            case "DestinyContractNumber":
            case "ProgramNumber":
                return true;
        }
        return this.isValidText(text, typeaheadDistinct, isWildSearch);
    }

    consolidateAdvancedSearchCriteria = (): SearchCriteria[] => {
        var criterias = [];
        var count = (<FormArray>this.myForm.controls['Criterias']).length;

        for (var i = 0; i < count; i++) {
            const control = (<FormArray>this.myForm.controls['Criterias']).at(i);
            var type = control.get("CriteriaType").value;
            var text = control.get("CriteriaText").value;

            if (!type || type == "" || !text || text == "" || !this.validateCriteria(type, text)) {
                continue;
            }

            var criteria = new SearchCriteria();
            criteria.criteriaType = type;
            criteria.criteriaText = text;
            criterias.push(criteria);
        }
        if (this.searchOptions.operator == "AND" && count > 2 && criterias.length < count) {
            criterias = [];
        }
        return criterias;
    }

    onFilteredChangeEvent = (value: string, text: string): void => {
        this.simpleSearchCriteriaText = text;
    }

    onSearchTextChange(event, criteriaType, criteriaText) {
        this.searchOptions.criterias = [];
        var charCode = (event.which) ? event.which : event.keyCode;
        if (criteriaType === "UWYear" && criteriaType.length < 4) {
            return charCode <= 31 || (charCode >= 48 && charCode <= 57)
        }

        if (charCode === 13) {
            this.doSearch();
        }
    }

    doSearch() {
        if (this.currentTabIndex == 2) {
            this.advancedSearch();
        }
        else if (this.currentTabIndex == 1) {
            this.simpleSearch();
        }
    }

    simpleSearch = (): void => {
        // if (!this.criteriaType || this.criteriaType == "" || !this.simpleSearchCriteriaText || this.simpleSearchCriteriaText == "" || !this.validateCriteria(this.criteriaType, this.simpleSearchCriteriaText)) {
        //     this._notify.warn("Please input search criteria");
        //     return;
        // }
        // var criteria = new SearchCriteria();
        // this.searchOptions.criterias = [];
        // criteria.criteriaType = this.criteriaType;
        // criteria.criteriaText = this.simpleSearchCriteriaText;
        // this.searchOptions.criterias.push(criteria);
        // this.searchOptions.teamGuid = -1;
        this.search();
    }

    advancedSearch = (): void => {
        // var criterias = this.consolidateAdvancedSearchCriteria();
        // if (criterias.length === 0) {
        //     this._notify.warn("Please input search criteria");
        //     return;
        // }
        // if (criterias.length > 0) {
        //     this.searchOptions.criterias = criterias;
        //     this.searchOptions.teamGuid = -1;
        //     this.search();
        // }

        this.search();
    }

    search = (): void => {
        this._notify.clear();
        this.resetProgramResults();

        //if (this.searchOptions.criterias.length > 0) {
            //if (!this.isTeamSearch)
            //{ this.searchOptions.teamGuid = -1; }
            //this.searchFromServer();
        //}
       // else {
            //this._notify.warn("Please provide valid search criteria");
//}

this.searchFromServer();
    }

    resetProgramResults() {
        this.programs = [];
        this.gridDataSource = [];
        this.ParameterText = '';
        this.programCount = 0;
    }


    searchFromServer = (): void => {
        this.gridDataSource = [];
        this.programs = [];
        this.showGridView = false;
        // var url = '/api/portfolio/PortfolioData';

        // this._webapi.post(url, this.searchOptions).map(res => res.json())
        // .finally(() => this.showGridView = true)
        // .subscribe(
        // (data) => {
        let data = PortfolioData;
        this.programs = data;
        this.pageIndex = 0;
        
        
        //temprary
        this.showGridView = true;
        
        
        
        
        this.loadMore();
        if (this.programs) {
            this.programCount = this.programs.length;
            if (this.programCount >= 200) {
                this._notify.warn("The screen is configured to display a maximum of 200 programs");
            }
            if (this.currentTabIndex == 1) {
                this.ParameterText = this.criteriaTypeText + ' = ' + this.simpleSearchCriteriaText;
            }
            else {
                this.ParameterText = '';
            }
        }
    };



    loadMore = (): void => {
        let start = (this.pageIndex * this.rowCountPerPage) + this.rowCountPerPage;
        if (this.pageIndex == 0) {
            start = 0;
        }
        let end = ((this.pageIndex + 1) * this.rowCountPerPage) + this.rowCountPerPage;
        if (this.programs && start <= this.programs.length) {

            if (!this.gridDataSource) {
                this.gridDataSource = [];
            }
            var tempPrograms = this.programs.slice(start, end);
            for (var t of tempPrograms) {
                this.gridDataSource.push(t);
            }
            this.pageIndex = this.pageIndex + 1;
        }
    }

    editSavedSearch = (): void => {
        this.showSaveSearchDialog = true;
    }

    createSavedSearch = (): void => {
        var criterias = this.consolidateAdvancedSearchCriteria();
        if (criterias.length > 0) {
            this.showSaveSearchDialog = true;
            this.savedSearchCtrl.addingNewSearch();
        }
        else {
            this._notify.warn("Please provide valid search criteria to Save it.");
        }
    }

    onSaveSearch = (): void => {
        if (!this.isEditSearch && this.searchname === '') {
            this._notify.warn("Please enter Search Name to Save Search.");
            return;
        }

        this.searchOptions.criterias = this.consolidateAdvancedSearchCriteria();

        if (!this.searchOptions.criterias || this.searchOptions.criterias.length === 0) {
            this._notify.warn("Please provide valid search criteria to Save it.");
        }
        else {
            let result = this.savedSearchCtrl.saveSearch(this.searchname, JSON.stringify(this.searchOptions));
            if (result) {
                this.savedSearchTransition();
            }
        }
    }

    savedSearchTransition() {
        this.currentTabIndex = 3;
        // this._fp.Tabbed.setActive("browseSearchTab", "search-tab-3");
        this.showSaveSearchDialog = false;
        this.initScreenData();
    }

    //Lavanya
    savedSearchChangedEvent(search: any): void {
        this.initScreenData();
        if (search.activeInd) {
            this.isEditSearch = search.isEdit;
            this.searchOptions = JSON.parse(search.criterias);

            if (this.isEditSearch && search.searchType == 2) {
                this.currentTabIndex = 2;
                // this._fp.Tabbed.setActive("browseSearchTab", "search-tab-2");
                this.myForm = this._fb.group({
                    Criterias: this._fb.array([])
                });
                let criteriaCount = this.searchOptions.criterias.length <= 2 ? 2 : this.searchOptions.criterias.length;
                for (var i = 0; i < criteriaCount; i++) {
                    if (i < this.searchOptions.criterias.length)
                        this.addCriteria(this.searchOptions.criterias[i].criteriaType, this.searchOptions.criterias[i].criteriaText, this.searchOptions.criterias[i].criteriaType);
                    else if (i >= this.searchOptions.criterias.length && this.searchOptions.criterias.length == 1)
                        this.addCriteria('Cedant', '', '');
                }
            }
            this.searchFromServer();
        }
        else {
            this.resetProgramResults();
        }
    }

    exceldownload() {
        if (this.programCount > 0) {
            var url = '/api/portfolio/ExportPrograms';
            this._webapi.downloadExcelByPost(url, this.searchOptions, "report.xlsx");
        }
    }
}