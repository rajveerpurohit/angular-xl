import { Component, OnInit } from '@angular/core';
import { Router, NavigationStart} from '@angular/router';
import { InitialDataService } from '../common/services/initial-data.service';

@Component({
    selector: 'xl-navmenu',
    templateUrl: './navmenu.component.html',
    styleUrls: ['./navmenu.component.less']
})
export class NavmenuComponent implements OnInit {
    fullImagePath: string;
    //isInRoles: boolean = false;
    isProduction: boolean = false;
    //randomNum: number;

    constructor(private _router: Router, private _init: InitialDataService) {
      
        this.fullImagePath = './assets/images/xlcatlin.jpg'

        //this._router.events.subscribe((evt) => {
        //    if(evt instanceof NavigationStart) {
        //        this.randomNum = Math.floor(Math.random() * Math.floor(10000));
        //    }
        //});
    }

    ngOnInit() {
        // this.resetDefaultMenustyle();
        //this.isInRoles = this._init.IsInRoles;
        this.isProduction = this._init.IsProduction;
    }

    
   

    browseNavigation = (event): void => {
        this._router.navigate(['/browse',Math.floor(Math.random() * Math.floor(10000)) ]);
    }



}
