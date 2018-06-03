import 'rxjs/add/operator/do';
import {Injectable} from '@angular/core';
import {Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot} from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { InitialDataService } from './initial-data.service';


@Injectable()
export class LoginGuardService implements CanActivate {
    constructor(private _init: InitialDataService, private _router: Router) {
  }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
        return Observable.of(this._init.IsAuth)
            .do(isLoggedIn => isLoggedIn || this._router.navigate(['/unauth']));
      
  }
}
