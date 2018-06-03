import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { RouterModule } from "@angular/router";
import { MaterialModule, MdButtonModule, MdDatepickerModule, MdInputModule, MdSelectModule, MdNativeDateModule } from '@angular/material';
import { CdkTableModule } from '@angular/cdk';
import { NewSubmissionComponent } from './newsubmission.component';
import { RenewSubmissionComponent } from './renew-submission.component';
import { UpdateSubmissionComponent } from './update-submission.component';
import { AddNewContractComponent } from './addnewcontract.component';
import { SubmissionComponent } from './submission.component';
import { LocationComponent } from './location.component';
import { RWBNotificationModule } from '../notification/notification.module';
import { NewSubmissionService } from './services/newsubmission-data.service';
import { SubmissionaddonComponent } from './submission-addon.component';


@NgModule({
    declarations: [
        NewSubmissionComponent,
        RenewSubmissionComponent,
        UpdateSubmissionComponent,
        SubmissionComponent,
        LocationComponent,
        AddNewContractComponent,
        SubmissionaddonComponent
    ],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        CommonModule,
        FormsModule,
        HttpModule,
        RouterModule,
        MaterialModule,
        MdNativeDateModule,
        ReactiveFormsModule,
        RWBNotificationModule
    ],
    providers: [
        NewSubmissionService
    ],
    exports: [
        NewSubmissionComponent,
        RenewSubmissionComponent,
        UpdateSubmissionComponent,
        SubmissionComponent,
        LocationComponent,
        AddNewContractComponent,
        SubmissionaddonComponent
    ]
})
export class SubmissionModule {

}
