import { Injectable } from '@angular/core';
import { Router, NavigationStart } from '@angular/router';
import { Observable } from 'rxjs';
import { Subject } from 'rxjs/Subject';

import { NotificationModel, NotificationTypeModel } from './notification.model';

@Injectable()
export class NotificationService{
    private subject = new Subject<NotificationModel>();
    private keepAfterRouteChange = false;

    constructor(private router: Router) {
        // clear alert messages on route change unless 'keepAfterRouteChange' flag is true
        router.events.subscribe(event => {
            if (event instanceof NavigationStart) {
                if (this.keepAfterRouteChange) {
                    // only keep for a single route change
                    this.keepAfterRouteChange = false;
                } else {
                    // clear alert messages
                    this.clear();
                }
            }
        });
    }

    getObservable(): Observable<NotificationModel> {
        return this.subject.asObservable();
    }

    success(message: string, keepAfterRouteChange = false) {
        this.notify(NotificationTypeModel.Success, message, keepAfterRouteChange);
    }

    error(message: string, keepAfterRouteChange = false) {
        this.notify(NotificationTypeModel.Error, message, keepAfterRouteChange);
    }

    info(message: string, keepAfterRouteChange = false) {
        this.notify(NotificationTypeModel.Info, message, keepAfterRouteChange);
    }

    warn(message: string, keepAfterRouteChange = false) {
        this.notify(NotificationTypeModel.Warning, message, keepAfterRouteChange);
    }

    notify(type: NotificationTypeModel, message: string, keepAfterRouteChange = false) {
        this.keepAfterRouteChange = keepAfterRouteChange;
        this.subject.next(<NotificationModel>{ type: type, message: message });
    }

    clear() {
        // clear alerts
        this.subject.next();
    }
}