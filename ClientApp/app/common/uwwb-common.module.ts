import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule } from "@angular/router";
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';

import { DataTableModule } from "angular2-datatable";

import { WebApiService } from './services/web-api.service';
import { InitialDataService } from './services/initial-data.service';
import { FoolproofControlService } from './services/foolproof-control.service';
import { OrderByPipe} from './pipes/orderby.pipe';
import { NumericFormatPipe } from './pipes/numericformat.pipe';
import { BlockUIService} from './services/block-ui.service';
import { BlockUIComponent } from './components/blockui/block-ui.component';
import { DefaultSorterComponent } from './components/default-sorter.component';
import { LoginGuardService } from './services/login-guard.service';
import { ConfirmDialogComponent } from './components/dialogs/confirm-dialog.component';
import { SelectComponent } from './components/select/select.component';
import { UtilityService } from './services/utility.service';


@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,
        HttpModule,
        DataTableModule
    ],

    declarations: [
        BlockUIComponent,
        DefaultSorterComponent,
        OrderByPipe,
        NumericFormatPipe,
        ConfirmDialogComponent,
        SelectComponent
    ],

    providers: [
        WebApiService,
        InitialDataService,
        FoolproofControlService,
        BlockUIService,
        LoginGuardService,
        UtilityService
    ],

    exports: [
        BlockUIComponent,
        OrderByPipe,
        NumericFormatPipe,
        DefaultSorterComponent,
        ConfirmDialogComponent,
        SelectComponent
    ]
})

export class UWWBCommonModule { }