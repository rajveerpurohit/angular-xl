import { Injectable } from '@angular/core';

declare var InitData: any;

@Injectable()
export class InitialDataService {

    private _programDetailsRenewFlags: { programNumber: string, isReadyForRenewal: boolean, isRenewed: boolean };

    public RetrieveDefaultValue = (name: string): string => {
        if (InitData) {
            let defaultEntity = InitData.defaults.find((val, index, array) => val.name == name);
            if (defaultEntity) {
                return defaultEntity.value;
            }
        }
        return "";
    }

    public RetrieveDefaultCompany = (): string => {
        return this.RetrieveDefaultValue('XL.CompanyGuid');
    }

    public RetrieveDefaultUnderwriter = (): string => {
        if (InitData) {
            return InitData.defaultsUnderwriter;
        }
        return "";
    }

    public RetrieveUserPhotoUrl = (userId: string): string => {
        if (userId) {
            var firstCharacter = userId.toLowerCase().charAt(0);
            var remainingCharacter = userId.substring(1, userId.length);
            userId = ((firstCharacter == "a" || firstCharacter == "x") && !isNaN(parseInt(remainingCharacter, 10))) ? "r02_" + userId : "catlin_" + userId;
        }
        return userId;
    }

    public IsUserAccessableCompany = (companyGuid: number): boolean => {
        var companies = InitData.allCompanies;
        if (companies) {
            for (var comp of companies) {
                if (comp.companyGUID == companyGuid) {
                    return true;
                }
            }
        }
        return false;
    }

    public IsUserEditableCompany = (companyGuid: number): boolean => {
        var companies = InitData.companies;
        if (companies) {
            for (var comp of companies) {
                if (comp.companyGUID == companyGuid) {
                    return true;
                }
            }
        }
        return false;
    }

    get ReDocAppLink(): string {
        if (InitData) {
            return InitData.reDocApp;
        }
        return "";
    }

    get ReCapCedantLink(): string {
        if (InitData) {
            return InitData.reCapCedant;
        }
        return "";
    }

    get ReCapBrokerLink(): string {
        if (InitData) {
            return InitData.reCapBroker;
        }
        return "";
    }


    get UserName(): string {
        if (InitData) {
            return InitData.userName;
        }
        return "";
    }

    get UserCompanies(): any[] {
        if (InitData) {
            return InitData.companies;
        }
        return null;
    }

    get UserAllCompanies(): any[] {
        if (InitData) {
            return InitData.allCompanies;
        }
        return null;
    }

    get UserId(): string {
        if (InitData) {
            return InitData.userId;
        }
        return "";
    }

    get IsUnderwriter(): boolean {
        if (InitData) {
            return InitData.isUnderwriter;
        }
        return false;
    }

    get BaseUrl(): string {
        if (InitData) {
            return InitData.baseUrl;
        }
        return '';
    }

    get IsProduction(): boolean {
        if (InitData) {
            return InitData.isProduction;
        }
        return false;
    }

    get IsActuary(): boolean {
        if (InitData) {
            return InitData.isActuary;
        }
        return false;
    }

    //get IsInRoles(): boolean {
    //    if (InitData) {
    //        return InitData.isInRoles;
    //    }
    //    return false;
    //}

    get IsAuth(): boolean {
        if (InitData) {
            return InitData.isAuth;
        }
        return false;
    }

    get programDetailsRenewFlags() {        
        return this._programDetailsRenewFlags;
    }
    set programDetailsRenewFlags(inputProgramDetailsRenewFlags) {        
        this._programDetailsRenewFlags = inputProgramDetailsRenewFlags;
    }
}