export class SearchCriteria {
    public  criteriaType : string;
    public criteriaText: string;
}


export class SearchOptions
{
    public criterias: Array<SearchCriteria>;
    public sortBy: string;
    public operator: string;
    public programType: number;
    public teamGuid: number;
    public isBoundOnly: boolean;
}

export class SavedSearch {
    public searchGuid: any;
    public searchName: string;
    public criterias: string;//Array<BrowseModel>;
    public orderId: number;
    public activeInd: boolean;
    public searchType: number;
    //public added_dt: Date;
    //public added_by: string;
    //public added_app: string;
    //public modify_dt1: Date;
    //public modify_by1: string;
    //public modify_app: string;
    public version: number;
    public isEdit: boolean;
}

