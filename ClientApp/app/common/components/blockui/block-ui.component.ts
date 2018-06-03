import { Component, OnInit } from '@angular/core';
import { BlockUIService } from '../../services/block-ui.service';

@Component({
    selector: 'rwb-blocak-ui',
    template: `
            <div class="over-layer" *ngIf="showOverLayer">
              <div class="loader">
              </div>
            </div>
        `
})
export class BlockUIComponent implements OnInit {
    private _counter = 0;

    showOverLayer = false;

    constructor(private _service: BlockUIService) { }

    ngOnInit() {
        this._service.getObservable().subscribe(val => {
            if (val) {
                this._counter++;
            }
            else {
                this._counter--;
            }

            this.showOverLayer = this._counter > 0;
        })
    }

}