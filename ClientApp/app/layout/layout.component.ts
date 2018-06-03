import { Component, OnInit } from '@angular/core';

import { InitialDataService } from '../common/services/initial-data.service';

@Component({
    selector: 'rwb-layout',
    templateUrl: './layout.component.html',
    styleUrls:['./layout.component.less']
})
export class LayoutComponent implements OnInit {

    userName: string;
    photoUrl: string;

    constructor(private _init: InitialDataService) { }

    ngOnInit() {
        this.userName = this._init.UserName;
        this.photoUrl = this._init.RetrieveUserPhotoUrl(this._init.UserId);
    }

}
