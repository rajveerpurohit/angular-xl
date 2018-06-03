import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';

@Component({
    selector: 'rwb-contract-layer',
    templateUrl: './contract-layer.component.html',
    styleUrls: ['./contract-layer.component.less']
})
export class ContractLayerComponent implements OnInit, OnChanges {

    @Input("layers") inputLayers = [];
    @Input("isProportional") isProportional = false;

    layers = [];

    hideDestinyContract = false;
    hideLayerStructure = false;
    hideShareLinesize = false;
    hideFirmOrderTerms = false;
    hideQuote = false;
    hideRageChange = false;
    hideAcqCostsExpense = false;
    hideBudgetPlan = false;
    hideDestinyFlags = false;
    hideCommissions = false;


    constructor() {
    }

    ngOnChanges(changes: SimpleChanges) {
        this.layers = this.inputLayers;
        this.hideDestinyContract = false;
        this.hideLayerStructure = false;
        this.hideShareLinesize = false;
        this.hideFirmOrderTerms = false;
        this.hideQuote = false;
        this.hideRageChange = false;
        this.hideAcqCostsExpense = false;
        this.hideBudgetPlan = false;
        this.hideDestinyFlags = false;
        this.hideCommissions = false;
    }

    ngOnInit() {
        this.layers = this.inputLayers;
    }

    onYesNoLayersFilterChanged = (val): void => {
        if (val == 'ALL') {
            this.layers = this.inputLayers;
        }
        else {
            this.layers = this.inputLayers.filter(task => task.layerFlag === val);
        }
    }


}