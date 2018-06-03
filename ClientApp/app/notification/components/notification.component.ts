import { Component, OnInit } from '@angular/core';

import { NotificationModel, NotificationTypeModel } from '../notification.model';
import { NotificationService } from '../notification.service';

@Component({
    selector: 'rwb-notification',
    templateUrl: './notification.component.html'
})
export class NotificationComponent implements OnInit {

    show = false;
    message: string;
    messageType: string;
    messageStyle: string;

    constructor(private _service: NotificationService)    {

    }

    ngOnInit() {
        this._service.getObservable().subscribe(val => {
            if (val) {
                this.showNotice(val);
            }
            else {
                this.closeNotice();
            }
            
        })
    }

    showNotice = (ent: NotificationModel): void => {
        
        if (ent.type == NotificationTypeModel.Error) {
            this.messageStyle = "notice--error";
            this.messageType = "Error";
        }
        else if (ent.type == NotificationTypeModel.Success) {
            this.messageStyle = "notice--success";
            this.messageType = "Success";
        }
        else if (ent.type == NotificationTypeModel.Warning) {
            this.messageStyle = "notice--warning";
            this.messageType = "Warning";
        }
        else {
            this.messageStyle = "notice--info";
            this.messageType = "Info";
        }
        this.message = ent.message;

        if (this.message && this.message.length > 0) {
            this.show = true;
            document.getElementsByTagName("body")[0].className = "body-with-notice";
        }
       
    }

    closeNotice = (): void => {
        this.show = false;
        document.getElementsByTagName("body")[0].className = "";
    }
}
