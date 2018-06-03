import { Injectable } from '@angular/core';

declare var XL_LIB: any;
declare var autoComplete: any;

@Injectable()
export class FoolproofControlService {

    public autoComplete = (ctrlId: string, choices: any[], onSelectChangeEvent, isStartWithSearch = true) => {

        var selectElement = document.getElementById(ctrlId);

        var autoCompleteElement = new autoComplete({
            selector: selectElement,
            minChars: 1,
            source: function (term, suggest) {
                term = term.toLowerCase();               
                var matches = [];
                var i;
                for (i = 0; i < choices.length; i++) {
                    var ii = 0;
                    if (typeof choices[i][1] === "string") {
                        //========================StartWith Search=====================
                        if (isStartWithSearch && choices[i][1].toLowerCase().startsWith(term)) {
                            matches.push(choices[i]);
                            //========================Contains Search=====================
                        } else if (!isStartWithSearch && choices[i][1].toLowerCase().indexOf(term) > -1) {
                            if (matches.length < 200)
                                matches.push(choices[i]);                            
                            else                                
                                break;
                        }
                    }
                    else {
                        //========================StartWith Search=====================
                        if (isStartWithSearch && choices[i][1][0].toLowerCase().startsWith(term)) {
                            matches.push(choices[i]);
                            //========================Contains Search=====================
                        } else if (!isStartWithSearch) {
                            var concatString = "";
                            for (ii = 0; ii < choices[i][1].length; ii++) {
                                concatString = concatString + " " + choices[i][1][ii].toLowerCase();
                            }
                            if (concatString.indexOf(term) > -1) {
                                if (matches.length < 200)
                                    matches.push(choices[i]);
                                else
                                    break;
                            }
                        }
                    }
                }
                suggest(matches, isStartWithSearch);
            },
            renderItem: function (item, search, isStartWithSearch) {
                var result = "";
                var itemContent = "";
                var itemValue = "";
                var i;
                var ii = 0;
                var multipleParts = false;
                if (typeof item[1] === "string") {

                    //========================StartWith Search=====================
                    if (isStartWithSearch && item[1].toLowerCase().startsWith(search.toLowerCase())) {
                        itemContent = item[1];
                        itemValue = item[1];
                        //========================Contains Search=====================
                    } else if (!isStartWithSearch && item[1].toLowerCase().indexOf(search.toLowerCase()) > -1) {
                        itemContent = item[1];
                        itemValue = item[1];
                    }
                }
                else {
                    //========================StartWith Search=====================
                    if (isStartWithSearch && item[1][0].toLowerCase().startsWith(search.toLowerCase())) {
                        multipleParts = true;
                        for (i = 0; i < item[1].length; i++) {
                            itemContent += '<span class="autocomplete-suggestion__part">' + item[1][i] + '</span>';
                            itemValue += (itemValue ? ", " : "") + item[1][i];
                        }
                        //========================Contains Search=====================
                    } else if (!isStartWithSearch && item[1][0].toLowerCase().indexOf(search.toLowerCase()) > -1) {
                        var concatString = "";
                        for (ii = 0; ii < item[1].length; ii++) {
                            concatString = concatString + " " + item[1][ii].toLowerCase();
                        }
                        if (concatString.indexOf(search) > -1) {
                            multipleParts = true;
                            for (i = 0; i < item[1].length; i++) {
                                itemContent += '<span class="autocomplete-suggestion__part">' + item[1][i] + '</span>';
                                itemValue += (itemValue ? ", " : "") + item[1][i];
                            }
                        }
                    }
                }
                if (itemValue && itemValue != '') {
                    result = '<div class="autocomplete-suggestion' + (multipleParts ? ' autocomplete-suggestion--multi-parts' : '') + '" data-langname="' + itemValue + '" data-lang="' + item[0] + '" data-val="' + itemValue + '">' + itemContent + '</div>';
                }
                return result;
            },
            onSelect: function (e, term, item) {                
                onSelectChangeEvent(item.getAttribute('data-lang'), item.getAttribute('data-langname'));
            }
        });
        return autoCompleteElement;
    }

    public InitDropdown = () => {
        XL_LIB.plugins.select.init();
    }

    public DestroyDropdown = (ctrlId: string) => {
        var el = document.getElementById(ctrlId);
        var selectInstance = XL_LIB.plugins.select.getSelect(el);        
        selectInstance.destroy();
    }

    public InitMultiTextDropdown = (ctrlId: string, choices: any[], onSelectChangeEvent) => {
        var el = document.getElementById(ctrlId);
        var selectInstance = XL_LIB.plugins.select.getSelect(el);
        selectInstance.setChoices(choices);
        selectInstance.OnSelect(onSelectChangeEvent);
    }

    public Tabbed = {
        InitTabbed: function () {
            XL_LIB.plugins.tabbed.init();
        },
        setActive: function (controlId: string, activeTabId: string) {
            XL_LIB.plugins.tabbed.setActive(controlId, activeTabId);
        }
    }    

    public InitTableScroller = () => {        
        XL_LIB.plugins.tableScroller.init();
    }
}