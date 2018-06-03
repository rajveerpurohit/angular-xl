import { Component, OnInit } from '@angular/core';
import { Router, NavigationStart, NavigationEnd } from "@angular/router";
import { Subscription } from "rxjs/Subscription";

@Component({
  selector: 'uwwb-app',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less']
})
export class AppComponent {
    title = 'Reinsurance Workbench';

    private routeScrollPositions: { [url: string]: number }[] = [];
    private subscriptions: Subscription[] = [];    
    private previousNavigationUrl: string;

    constructor(private router: Router) {
        history.scrollRestoration = 'manual';

        this.subscriptions.push(
            router.events.subscribe(event => {
                if (event instanceof NavigationStart) {
                    let index = this.previousNavigationUrl !== null ? this.previousNavigationUrl : event.url;
                    this.routeScrollPositions[index] = window.pageYOffset;

                } else if (event instanceof NavigationEnd) {
                    this.previousNavigationUrl = event.urlAfterRedirects;
                    if (typeof this.routeScrollPositions[event.url] !== 'undefined') {
                        window.scrollTo(0, this.routeScrollPositions[event.url] || 0);
                    } else {
                        window.scrollTo(0, 0);
                    }
                };
            })
        );
    }
}
