import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { NewSubmissionComponent } from './submission/newsubmission.component';
import { ProgramDetailsComponent } from './programdetails/components/program-details.component';
import { BrowseComponent } from './browse/browse.component';
import { RenewSubmissionComponent } from './submission/renew-submission.component';
import { UpdateSubmissionComponent } from './submission/update-submission.component';
import { AddNewContractComponent } from './submission/addnewcontract.component';
import { LayoutComponent } from './layout/layout.component';
import { UnauthComponent } from './unauth/unauth.component';
import { AboutComponent } from './about/about.component';
import { TodoComponent } from './todo/todo.component';
import { AssignedComponent } from './assigned/assigned.component';

import { LoginGuardService } from './common/services/login-guard.service';

const routes: Routes = [
    { path: '', redirectTo: 'home', pathMatch: 'full' },
    { path: 'unauth', component: UnauthComponent },
    {
        path: '',   
        component: LayoutComponent,
        canActivate: [LoginGuardService],
        children: [
            { path: 'home', component: HomeComponent },
            { path: 'todo', component: TodoComponent },
            { path: 'assigned', component: AssignedComponent },
            { path: 'home/:programType/:programTypeName', component: HomeComponent },
            { path: 'home/:programType/:programTypeName/:IsNew', component: HomeComponent },
            { path: 'newsubmission', component: NewSubmissionComponent },
            { path: 'renewsubmission/:programNum', component: RenewSubmissionComponent },
            { path: 'updatesubmission/:programNum', component: UpdateSubmissionComponent },
            { path: 'addnewcontract/:programNum/:ProgramTitle', component: AddNewContractComponent },
            { path: 'addnewcontract/:programNum/:ProgramTitle/:IsReadyForRenewal/:IsRenewed/:cedantKey/:cedantLocationGUID/:brokerGuid/:brokerLocationGUID', component: AddNewContractComponent },
            { path: 'browse/:random', component: BrowseComponent },
            //{ path: 'programdetails/:programNum', component: ProgramDetailsComponent },
            { path: 'programdetails/:programNum/:ProgramTitle', component: ProgramDetailsComponent },
            { path: 'programdetails/:programNum/:IsRenew/:ProgramTitle', component: ProgramDetailsComponent },
            { path: 'programdetails/:programNum/:IsReadyForRenewal/:IsRenewed/:ProgramTitle', component: ProgramDetailsComponent },
            { path: 'programdetails/:programNum/:IsReadyForRenewal/:IsRenewed/:ProgramTitle/:random', component: ProgramDetailsComponent },
            { path: 'about', component: AboutComponent },
            { path: '**', redirectTo: '/home' }
        ]
    }
];

@NgModule({
    imports: [RouterModule.forRoot(routes,{useHash:true})],
    exports: [RouterModule]
})
export class AppRoutingModule { }
