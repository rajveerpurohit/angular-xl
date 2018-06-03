import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpModule } from '@angular/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from "@angular/router";
import { MaterialModule, MdNativeDateModule } from '@angular/material';
import { FileUploadModule } from 'ng2-file-upload';
import { SubmissionModule } from '../submission/submission.module';
import { ProgramDetailsComponent } from './components/program-details.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { UploadDocumentComponent } from './components/uploaddocument/upload-document.component';
import { ViewDocumentsComponent } from './components/viewdocuments/view-documents.component';
import { DataTableModule } from "angular2-datatable";
import { UWWBCommonModule } from '../common/uwwb-common.module'
import { UpdateDocumentsComponent } from './components/updatedocuments/update-documents.component';
import { ViewClearanceReportsComponent } from './components/viewclearancereport/view-clearance-report.component';
import { ContractLayerComponent } from './components/contractlayer/contract-layer.component';
import { UpdateTrackingDatesComponent } from './components/updatetrackingdates/update-tracking-dates.component';
import { RWBNotificationModule } from '../notification/notification.module';
import { TrackingDatepickerComponent } from './components/trackingdatepicker/tracking-datepicker.component';


@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        HttpModule,
        FileUploadModule,
        SubmissionModule,
        DataTableModule,
        UWWBCommonModule,
        RouterModule,
        MaterialModule,
        MdNativeDateModule,
        RWBNotificationModule
    ],

    declarations: [
        ProgramDetailsComponent,
        ViewDocumentsComponent,
        UploadDocumentComponent,
        UpdateDocumentsComponent,
        ViewClearanceReportsComponent,
        ContractLayerComponent,
        UpdateTrackingDatesComponent,
        TrackingDatepickerComponent
    ],

    exports: [
        ProgramDetailsComponent,
        ViewDocumentsComponent,
        UploadDocumentComponent,
        UpdateDocumentsComponent,
        ViewClearanceReportsComponent,
        ContractLayerComponent,
        UpdateTrackingDatesComponent,
        TrackingDatepickerComponent
    ]
})

export class ProgramDetailsModule { }
