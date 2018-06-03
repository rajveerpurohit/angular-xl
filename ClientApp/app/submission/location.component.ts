import { Component, Input, Output } from '@angular/core';
import { LocationModel } from './models/location.model';

@Component({
    selector: 'uwwb-location',
    templateUrl: './location.component.html',
    styleUrls:['./location.component.less']
})
export class LocationComponent {

    @Input() location: LocationModel;

}
