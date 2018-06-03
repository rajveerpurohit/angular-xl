import { Component, OnInit, Input } from "@angular/core";
import { DataTable, SortEvent } from "angular2-datatable";

@Component({
    selector: 'defaultSorter',
    template: `<a style="cursor: pointer" (click)="sort()" class="text-nowrap">
            <ng-content></ng-content>
            <span *ngIf="isSortedByMeAsc" class="glyphicon glyphicon-triangle-top" aria-hidden="true"></span>
            <span *ngIf="isSortedByMeDesc" class="glyphicon glyphicon-triangle-bottom" aria-hidden="true"></span>
            <span *ngIf="!isSortedByMeAsc && !isSortedByMeDesc" class="glyphicon glyphicon-sort" aria-hidden="true"></span>
        </a>`
})

export class DefaultSorterComponent implements OnInit {
    @Input('by') private sortBy: string;
    @Input('initial') private initial: string;
    private isSortedByMeAsc: boolean = false;
    private isSortedByMeDesc: boolean = false;
    

    constructor(private mfTable: DataTable) {
        mfTable.onSortChange.subscribe((event: SortEvent) => {
            this.isSortedByMeAsc = (event.sortBy === this.sortBy && event.sortOrder === 'asc');
            this.isSortedByMeDesc = (event.sortBy === this.sortBy && event.sortOrder === 'desc');
        });
    }

    ngOnInit() {
        if (this.initial) {
            if (this.initial === 'asc') {
                this.mfTable.setSort(this.sortBy, 'asc');
            } else {
                this.mfTable.setSort(this.sortBy, 'desc');
            }
        }
    }

    sort() {
        if (this.isSortedByMeAsc) {
            this.mfTable.setSort(this.sortBy, 'desc');
        } else {
            this.mfTable.setSort(this.sortBy, 'asc');
        }
    }
}