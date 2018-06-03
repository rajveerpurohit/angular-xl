import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
    selector: 'xl-select',
    templateUrl: './select.component.html',
    styleUrls: ['./select.component.less']
})
export class SelectComponent implements OnInit {
    // to be added in parent components
    // <xl-select [list]="dropdownList" (optionSelected)="optionSelectedHandler($event)"></xl-select>
    // dropdownList:object = {"defaultValue":"a","listArray": ["a","b", "c"]};
    //  optionSelectedHandler = ($event) =>{
    //   console.log($event);
    // }
    selectedItem: any;
    isClicked = false;
    

    //----------------------------XLC RWB team changed--------------------------------Begin
    //@Input() list: any[];

    private optionList: any[];
    @Input() set list(opts: any[] ){
        this.optionList = opts;
        this.selectedItem = this.optionList["defaultValue"] || this.optionList["listArray"][0];
        //this.optionSelected.emit(this.selectedItem);
    }

    get list(): any[] {
        return this.optionList;
    }
    //----------------------------XLC RWB team changed--------------------------------End

    @Output() optionSelected = new EventEmitter();

    constructor() {
        document.addEventListener('click', this.offClickHandler.bind(this));
    }

    ngOnInit() {
        this.selectedItem = this.list["defaultValue"] || this.list["listArray"][0];
    }

    offClickHandler(event: any) {
        if (!event.target.closest(".select")) {
            this.isClicked = false;
        }
    }

    handleSelectEvent = (): void => {
        const selectNode = document.querySelectorAll('.select .is-open');
        const optionNode = document.querySelectorAll('.select .is-active');
        if (selectNode.length || optionNode.length) {
            if (selectNode[0].classList.contains('is-open')) {
                selectNode[0].classList.remove('is-open');
                optionNode[0].classList.remove('is-active');
            }
        }
        this.isClicked = !this.isClicked;
    }

    selectedOption = (item: any): void => {
        this.selectedItem = item;
        console.log("this.selecteItem", this.selectedItem);
        this.handleSelectEvent();
        this.optionSelected.emit(item);
    }
    addHighlightClass = ($event, item) => {
        const childNodes = $event.currentTarget.parentNode.childNodes;
        [].forEach.call(childNodes, function (el) {
            if (el.nodeType === Node.ELEMENT_NODE && el.classList.contains("is-highlighted")) {
                el.classList.remove("is-highlighted");
            }

        });
        $event.target.className = $event.target.className + ' is-highlighted';
    }

    ngOnDestroy() {
        document.removeEventListener('click', this.offClickHandler.bind(this));
    }
}
