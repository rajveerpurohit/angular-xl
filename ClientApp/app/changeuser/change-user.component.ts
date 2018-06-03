import { Component, HostListener } from '@angular/core';
import { WebApiService } from '../common/services/web-api.service';
import 'rxjs/add/operator/map';
import { Observable } from 'rxjs/Observable';

import { InitialDataService } from '../common/services/initial-data.service';

@Component({
    selector: 'change-user',
    templateUrl: './change-user.component.html',
    styleUrls: ['./change-user.component.less']
})
export class ChangeUserComponent {

    show = false;
    userId: string;
    message: string;

    constructor(private _http: WebApiService, private _init: InitialDataService) { }

    @HostListener('document:click', ['$event'])
    clickout(event) {
        if (!this._init.IsProduction) {
            if (event.target.id === 'btnChangeUser') {
                this.show = true;
            }
            //console.log(event.target);
        }
    }

    cancel() {
        this.show = false;
    }

    submit() {
        if (this.userId == null || this.userId.trim() == '') {
            this.message = "Please input the user ID";
        }
        else {
            this._http.post('/api/Auth/ChangeUser?userId=' + this.userId, null).subscribe(
                (data) => {
                    window.location.href = this._init.BaseUrl + '/home';
                },
                (err) => {
                    this.message = err.message;
                },
                () => console.log("Done")
            );
        }
    }
}