import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule } from "@angular/router";
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { NotificationComponent} from './components/notification.component'
import { NotificationService} from './notification.service';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,
        HttpModule
    ],

    declarations: [
        NotificationComponent
    ],

    providers: [
        NotificationService
    ],

    exports: [
        NotificationComponent
    ]
})

export class RWBNotificationModule { }