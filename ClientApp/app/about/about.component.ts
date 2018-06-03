import { Component } from '@angular/core';
import { WebApiService } from '../common/services/web-api.service';
import { InitialDataService } from '../common/services/initial-data.service';

@Component({
    selector: 'rwb-about',
    templateUrl: './about-qa.component.html',
    styleUrls: ['./about.component.less']
})
export class AboutComponent {

    releaseNotes = [];

    constructor(private _webapi: WebApiService, private _init: InitialDataService) {
    }

    ngOnInit() {
        this.getReleaseNotes();
    }


    getReleaseNotes = (): void => {
        var url = '/src/assets/release-notes.json';
        this._webapi.get(url, false).subscribe(
            (data) => {
                if (data) {
                    this.releaseNotes = data.json();                    
                }
            },
            (error) => {
                console.log('Error on getReleaseNotes method:' + error);
            });

    }
}