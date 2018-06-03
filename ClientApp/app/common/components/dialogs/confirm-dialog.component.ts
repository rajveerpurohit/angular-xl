import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
    selector: 'rwb-confirm-dialog',
    templateUrl:'./confirm-dialog.component.html'
})
export class ConfirmDialogComponent {
    @Input() title: string;
    @Input() message: string;
    @Input() display: boolean = false;

    @Output() ok = new EventEmitter<boolean>();
    @Output() cancel = new EventEmitter<boolean>();

    onOk = (): void => {
        this.close();
        this.ok.emit(this.display);
    }

    onCancel = (): void => {
        this.close();
        this.cancel.emit(this.display);
    }

    close = (): void =>{
        this.display = false;
    }
}