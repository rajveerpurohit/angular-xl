import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Subject } from 'rxjs/Subject';

@Injectable()
export class BlockUIService {
    private subject = new Subject<boolean>();

    getObservable(): Observable<boolean> {
        return this.subject.asObservable();
    }

    show() {
        this.subject.next(true);
    }

    hide() {
        this.subject.next(false);
    }
}