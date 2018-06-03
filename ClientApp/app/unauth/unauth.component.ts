import { Component } from '@angular/core';

import { InitialDataService } from '../common/services/initial-data.service';

@Component({
    selector: 'rwb-unauth',
    templateUrl: './unauth.component.html'
})
export class UnauthComponent {

    isProd = true;

    constructor(private _init: InitialDataService) {
        this.isProd = this._init.IsProduction;
    }


}
