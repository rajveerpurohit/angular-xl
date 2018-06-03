import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { BrowserModule } from '@angular/platform-browser';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { RouterModule, RouteReuseStrategy } from "@angular/router";
import 'hammerjs';

import { UWWBCommonModule } from './common/uwwb-common.module';
import { AppRoutingModule } from './app-routing.module';
import { SubmissionModule } from './submission/submission.module';
import { ProgramDetailsModule } from './programdetails/program-details.module';
import { RWBNotificationModule } from './notification/notification.module';

import { DataTableModule } from "angular2-datatable";
import { DndModule } from 'ng2-dnd';


import { AppComponent } from './app.component';
import { NavmenuComponent } from './navmenu/navmenu.component';
import { PortfolioViewComponent } from './portfolioview/portfolio-view.component';
import { HomeComponent } from './home/home.component';
import { BrowseComponent } from './browse/browse.component';
import { SavedSearchComponent } from './browse/saved-search.component';
import { ChangeUserComponent } from './changeuser/change-user.component';
import { LayoutComponent } from './layout/layout.component';
import { AboutComponent } from './about/about.component';
import { UnauthComponent } from './unauth/unauth.component';
import { CustomReuseStrategy } from "./common/router/custom-reuse-strategy";

import { MaterialModule, MdAutocompleteModule, MdButtonModule, MdDatepickerModule, MdExpansionModule, MdGridListModule, MdInputModule, MdPaginatorModule, MdSelectModule, MdTableModule, MdNativeDateModule } from '@angular/material';
import { CdkTableModule } from '@angular/cdk';
import { TodoComponent } from './todo/todo.component';
import { AssignedComponent } from './assigned/assigned.component';


@NgModule({
    exports: [
        CdkTableModule,
        MdAutocompleteModule,
        MdButtonModule,
        MdDatepickerModule,
        MdExpansionModule,
        MdGridListModule,
        MdInputModule,
        MdPaginatorModule,
        MdSelectModule,
        MdTableModule
    ]
})
export class PlunkerMaterialModule { }


@NgModule({
  declarations: [
      AppComponent,
      NavmenuComponent,
      PortfolioViewComponent,
      HomeComponent,      
      ChangeUserComponent,
      BrowseComponent,
      SavedSearchComponent,
      LayoutComponent,
      UnauthComponent,
      AboutComponent,
      TodoComponent,
      AssignedComponent
  ],
  imports: [
      BrowserModule,
      BrowserAnimationsModule,
      CommonModule,
      FormsModule,
      HttpModule,
      RouterModule,
      PlunkerMaterialModule,
      BrowserAnimationsModule,
      MaterialModule,
      MdNativeDateModule,
      ReactiveFormsModule,
      DndModule.forRoot(),
      AppRoutingModule,
      UWWBCommonModule,
      RWBNotificationModule,
      SubmissionModule,  
      ProgramDetailsModule,
      DataTableModule
  ],
  providers: [
      { provide: RouteReuseStrategy, useClass: CustomReuseStrategy }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { 
    public Name: string = "Reinsurance Workbench";
}
