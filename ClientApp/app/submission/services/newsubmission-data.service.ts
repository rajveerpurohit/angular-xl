import { NewSubmission } from '../models/newsubmission';
import { CedantModel } from '../models/cedant.model';
import { LocationModel } from '../models/location.model';
import { Injectable } from '@angular/core';
import { Http, Response, Headers } from '@angular/http';
import 'rxjs/add/operator/map';
import { Observable } from 'rxjs/Observable';

import { WebApiService } from '../../common/services/web-api.service';

@Injectable()
export class NewSubmissionService {

    private actionUrl: string;    
    private locationActionUrl: string;

    constructor(private _webapi: WebApiService) {
        this.actionUrl = '/api/program/NewProgram/';        
        this.locationActionUrl = '/api/ReferenceData/locations?guid=';
    }    

    public Add = (submissionToAdd: NewSubmission): Observable<NewSubmission> => {        
        //let toAdd = JSON.stringify({
        //    cedantKey: submissionToAdd.cedantKey
        //    , cedantLocationKey: submissionToAdd.cedantLocationKey
        //    , companyKey: submissionToAdd.companyKey
        //    , effectiveDate: submissionToAdd.effectiveDate
        //    , expirationDate: submissionToAdd.expirationDate
        //    , brokerKey: submissionToAdd.brokerKey
        //    , brokerLocationKey: submissionToAdd.brokerLocationKey
        //    , programTitle: submissionToAdd.programTitle
        //    , uwYear: submissionToAdd.uwYear
        //    , underwriter: submissionToAdd.underwriter
        //});

        return this._webapi.post(this.actionUrl, submissionToAdd).map(res => <NewSubmission>res.json());
    }    

    public GetAllCedant = (actionUrl: string): Observable<CedantModel[]> => {        
        return this._webapi.get(actionUrl).map(res => <CedantModel[]>res.json());
    }

    public GetAllLocation = (guid: number): Observable<LocationModel[]> => {
        return this._webapi.get(this.locationActionUrl + guid).map(res => <LocationModel[]>res.json());
    }


    public GetUnderwriters = (url:string): Observable<any> => {
        return this._webapi.get(url).map(res => res.json());
    }
}