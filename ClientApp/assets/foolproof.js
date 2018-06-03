/*
    JavaScript autoComplete v1.0.4
    Copyright (c) 2014 Simon Steinberger / Pixabay
    GitHub: https://github.com/Pixabay/JavaScript-autoComplete
    License: http://www.opensource.org/licenses/mit-license.php
*/

var autoComplete = (function () {
    // "use strict";
    function autoComplete(options) {
        if (!document.querySelector) return;

        // helpers
        function hasClass(el, className) { return el.classList ? el.classList.contains(className) : new RegExp('\\b' + className + '\\b').test(el.className); }

        function addEvent(el, type, handler) {
            if (el.attachEvent) el.attachEvent('on' + type, handler); else el.addEventListener(type, handler);
        }
        function removeEvent(el, type, handler) {
            // if (el.removeEventListener) not working in IE11
            if (el.detachEvent) el.detachEvent('on' + type, handler); else el.removeEventListener(type, handler);
        }
        function live(elClass, event, cb, context) {
            addEvent(context || document, event, function (e) {
                var found, el = e.target || e.srcElement;
                while (el && !(found = hasClass(el, elClass))) el = el.parentElement;
                if (found) cb.call(el, e);
            });
        }

        var o = {
            selector: 0,
            source: 0,
            minChars: 3,
            delay: 150,
            offsetLeft: 0,
            offsetTop: 1,
            cache: 1,
            menuClass: '',
            isStartWithSearchParam: true,
            renderItem: function (item, search, isStartWithSearch) {                
                // escape special characters
                search = search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
                var re = new RegExp("(" + search.split(' ').join('|') + ")", "gi");
                return '<div class="autocomplete-suggestion" data-val="' + item + '">' + item.replace(re, "<b>$1</b>") + '</div>';
            },
            onSelect: function (e, term, item) { }
        };
        for (var k in options) { if (options.hasOwnProperty(k)) o[k] = options[k]; }

        // init
        var elems = typeof o.selector == 'object' ? [o.selector] : document.querySelectorAll(o.selector);
        for (var i = 0; i < elems.length; i++) {
            var that = elems[i];

            // create suggestions container "sc"
            that.sc = document.createElement('div');
            that.sc.className = 'autocomplete-suggestions ' + o.menuClass;

            that.autocompleteAttr = that.getAttribute('autocomplete');
            that.setAttribute('autocomplete', 'off');
            that.cache = {};
            that.last_val = '';

            that.updateSC = function (resize, next) {
                var rect = that.getBoundingClientRect();
                that.sc.style.left = Math.round(rect.left + (window.pageXOffset || document.documentElement.scrollLeft) + o.offsetLeft) + 'px';
                that.sc.style.top = Math.round(rect.bottom + (window.pageYOffset || document.documentElement.scrollTop) + o.offsetTop) + 'px';
                that.sc.style.minWidth = Math.round(rect.right - rect.left) + 'px'; // outerWidth
                if (!resize) {
                    that.sc.style.display = 'block';
                    if (!that.sc.maxHeight) { that.sc.maxHeight = parseInt((window.getComputedStyle ? getComputedStyle(that.sc, null) : that.sc.currentStyle).maxHeight); }
                    if (!that.sc.suggestionHeight) that.sc.suggestionHeight = that.sc.querySelector('.autocomplete-suggestion').offsetHeight;
                    if (that.sc.suggestionHeight)
                        if (!next) that.sc.scrollTop = 0;
                        else {
                            var scrTop = that.sc.scrollTop, selTop = next.getBoundingClientRect().top - that.sc.getBoundingClientRect().top;
                            if (selTop + that.sc.suggestionHeight - that.sc.maxHeight > 0)
                                that.sc.scrollTop = selTop + that.sc.suggestionHeight + scrTop - that.sc.maxHeight;
                            else if (selTop < 0)
                                that.sc.scrollTop = selTop + scrTop;
                        }
                }
            }
            addEvent(window, 'resize', that.updateSC);


            if (document.body) {
                document.body.appendChild(that.sc);
            }

            live('autocomplete-suggestion', 'mouseleave', function (e) {
                var sel = that.sc.querySelector('.autocomplete-suggestion.selected');
                if (sel) setTimeout(function () { sel.className = sel.className.replace('selected', ''); }, 20);
            }, that.sc);

            live('autocomplete-suggestion', 'mouseover', function (e) {
                var sel = that.sc.querySelector('.autocomplete-suggestion.selected');
                if (sel) sel.className = sel.className.replace('selected', '');
                this.className += ' selected';
            }, that.sc);

            live('autocomplete-suggestion', 'mousedown', function (e) {
                if (hasClass(this, 'autocomplete-suggestion')) { // else outside click
                    var v = this.getAttribute('data-val');
                    that.value = v;
                    o.onSelect(e, v, this);
                    that.sc.style.display = 'none';
                }
            }, that.sc);

            that.blurHandler = function () {
                try { var over_sb = document.querySelector('.autocomplete-suggestions:hover'); } catch (e) { var over_sb = 0; }
                if (!over_sb) {
                    that.last_val = that.value;
                    that.sc.style.display = 'none';
                    setTimeout(function () { that.sc.style.display = 'none'; }, 350); // hide suggestions on fast input
                } else if (that !== document.activeElement) setTimeout(function () { that.focus(); }, 20);
            };
            addEvent(that, 'blur', that.blurHandler);

            var suggest = function (data, isStartWithSearch) {                
                o.isStartWithSearchParam = typeof isStartWithSearch !== 'undefined'? isStartWithSearch : true;
                var val = that.value;
                that.cache[val] = data;
                if (data.length && val.length >= o.minChars) {
                    var s = '';
                    for (var i = 0; i < data.length; i++) s += o.renderItem(data[i], val, o.isStartWithSearchParam);
                    that.sc.innerHTML = s;
                    that.updateSC(0);
                }
                else
                    that.sc.style.display = 'none';
            }

            that.keydownHandler = function (e) {
                var key = window.event ? e.keyCode : e.which;
                // down (40), up (38)
                if ((key == 40 || key == 38) && that.sc.innerHTML) {
                    var next, sel = that.sc.querySelector('.autocomplete-suggestion.selected');
                    if (!sel) {
                        next = (key == 40) ? that.sc.querySelector('.autocomplete-suggestion') : that.sc.childNodes[that.sc.childNodes.length - 1]; // first : last
                        next.className += ' selected';
                        that.value = next.getAttribute('data-val');
                    } else {
                        next = (key == 40) ? sel.nextSibling : sel.previousSibling;
                        if (next) {
                            sel.className = sel.className.replace('selected', '');
                            next.className += ' selected';
                            that.value = next.getAttribute('data-val');
                        }
                        else { sel.className = sel.className.replace('selected', ''); that.value = that.last_val; next = 0; }
                    }
                    that.updateSC(0, next);
                    return false;
                }
                // esc
                else if (key == 27) { that.value = that.last_val; that.sc.style.display = 'none'; }
                // enter
                else if (key == 13 || key == 9) {
                    var sel = that.sc.querySelector('.autocomplete-suggestion.selected');
                    if (sel && that.sc.style.display != 'none') { o.onSelect(e, sel.getAttribute('data-val'), sel); setTimeout(function () { that.sc.style.display = 'none'; }, 20); }
                }
            };
            addEvent(that, 'keydown', that.keydownHandler);

            that.keyupHandler = function (e) {
                var key = window.event ? e.keyCode : e.which;
                if (!key || (key < 35 || key > 40) && key != 13 && key != 27) {
                    var val = that.value;
                    if (val.length >= o.minChars) {
                        if (val != that.last_val) {
                            that.last_val = val;
                            clearTimeout(that.timer);
                            if (o.cache) {
                                if (val in that.cache) { suggest(that.cache[val], o.isStartWithSearchParam); return; }
                                // no requests if previous suggestions were empty
                                for (var i = 1; i < val.length - o.minChars; i++) {
                                    var part = val.slice(0, val.length - i);
                                    if (part in that.cache && !that.cache[part].length) { suggest([], o.isStartWithSearchParam); return; }
                                }
                            }
                            that.timer = setTimeout(function () { o.source(val, suggest) }, o.delay);
                        }
                    } else {
                        that.last_val = val;
                        that.sc.style.display = 'none';
                    }
                }
            };
            addEvent(that, 'keyup', that.keyupHandler);

            that.focusHandler = function (e) {
                that.last_val = '\n';
                that.keyupHandler(e)
            };
            if (!o.minChars) addEvent(that, 'focus', that.focusHandler);
        }

        // public destroy method
        this.destroy = function () {
            for (var i = 0; i < elems.length; i++) {
                var that = elems[i];
                removeEvent(window, 'resize', that.updateSC);
                removeEvent(that, 'blur', that.blurHandler);
                removeEvent(that, 'focus', that.focusHandler);
                removeEvent(that, 'keydown', that.keydownHandler);
                removeEvent(that, 'keyup', that.keyupHandler);
                if (that.autocompleteAttr)
                    that.setAttribute('autocomplete', that.autocompleteAttr);
                else
                    that.removeAttribute('autocomplete');

                if (document.body) {
                    document.body.removeChild(that.sc);
                }
                that = null;
            }
        };
    }
    return autoComplete;
})();

(function () {
    if (typeof define === 'function' && define.amd)
        define('autoComplete', function () { return autoComplete; });
    else if (typeof module !== 'undefined' && module.exports)
        module.exports = autoComplete;
    else
        window.autoComplete = autoComplete;
})();
/*! choices.js v3.0.2 | (c) 2017 Josh Johnson | https://github.com/jshjohnson/Choices#readme */
(function webpackUniversalModuleDefinition(root, factory) {
    if (typeof exports === 'object' && typeof module === 'object')
        module.exports = factory();
    else if (typeof define === 'function' && define.amd)
        define([], factory);
    else if (typeof exports === 'object')
        exports["Choices"] = factory();
    else
        root["Choices"] = factory();
})(this, function () {
    return /******/ (function (modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if (installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
                /******/
};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
            /******/
}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "/assets/scripts/dist/";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
        /******/
})
/************************************************************************/
/******/([
/* 0 */
/***/ (function (module, exports, __webpack_require__) {

                module.exports = __webpack_require__(1);


                /***/
}),
/* 1 */
/***/ (function (module, exports, __webpack_require__) {

                'use strict';

                var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

                var _fuse = __webpack_require__(2);

                var _fuse2 = _interopRequireDefault(_fuse);

                var _classnames = __webpack_require__(3);

                var _classnames2 = _interopRequireDefault(_classnames);

                var _index = __webpack_require__(4);

                var _index2 = _interopRequireDefault(_index);

                var _index3 = __webpack_require__(30);

                var _utils = __webpack_require__(31);

                __webpack_require__(32);

                function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

                function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

                function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

                function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

                /**
                 * Choices
                 */
                var Choices = function () {
                    function Choices() {
                        var element = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '[data-choice]';
                        var userConfig = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

                        _classCallCheck(this, Choices);

                        // If there are multiple elements, create a new instance
                        // for each element besides the first one (as that already has an instance)
                        if ((0, _utils.isType)('String', element)) {
                            var elements = document.querySelectorAll(element);
                            if (elements.length > 1) {
                                for (var i = 1; i < elements.length; i += 1) {
                                    var el = elements[i];
                                    /* eslint-disable no-new */
                                    new Choices(el, userConfig);
                                }
                            }
                        }

                        var defaultConfig = {
                            silent: false,
                            items: [],
                            choices: [],
                            renderChoiceLimit: -1,
                            maxItemCount: -1,
                            addItems: true,
                            removeItems: true,
                            removeItemButton: false,
                            editItems: false,
                            duplicateItems: true,
                            delimiter: ',',
                            paste: true,
                            searchEnabled: true,
                            searchChoices: true,
                            searchFloor: 1,
                            searchResultLimit: 4,
                            searchFields: ['label', 'value'],
                            position: 'auto',
                            resetScrollPosition: true,
                            regexFilter: null,
                            shouldSort: true,
                            shouldSortItems: false,
                            sortFilter: _utils.sortByAlpha,
                            placeholder: true,
                            placeholderValue: null,
                            searchPlaceholderValue: null,
                            prependValue: null,
                            appendValue: null,
                            renderSelectedChoices: 'auto',
                            loadingText: 'Loading...',
                            noResultsText: 'No results found',
                            noChoicesText: 'No choices to choose from',
                            itemSelectText: 'Press to select',
                            addItemText: function addItemText(value) {
                                return 'Press Enter to add <b>"' + value + '"</b>';
                            },
                            maxItemText: function maxItemText(maxItemCount) {
                                return 'Only ' + maxItemCount + ' values can be added.';
                            },
                            uniqueItemText: 'Only unique values can be added.',
                            classNames: {
                                containerOuter: 'choices',
                                containerInner: 'choices__inner',
                                input: 'choices__input',
                                inputCloned: 'choices__input--cloned',
                                list: 'choices__list',
                                listItems: 'choices__list--multiple',
                                listSingle: 'choices__list--single',
                                listDropdown: 'choices__list--dropdown',
                                item: 'choices__item',
                                itemSelectable: 'choices__item--selectable',
                                itemDisabled: 'choices__item--disabled',
                                itemChoice: 'choices__item--choice',
                                placeholder: 'choices__placeholder',
                                group: 'choices__group',
                                groupHeading: 'choices__heading',
                                button: 'choices__button',
                                activeState: 'is-active',
                                focusState: 'is-focused',
                                openState: 'is-open',
                                disabledState: 'is-disabled',
                                highlightedState: 'is-highlighted',
                                hiddenState: 'is-hidden',
                                flippedState: 'is-flipped',
                                loadingState: 'is-loading',
                                noResults: 'has-no-results',
                                noChoices: 'has-no-choices'
                            },
                            fuseOptions: {
                                include: 'score'
                            },
                            callbackOnInit: null,
                            callbackOnCreateTemplates: null
                        };

                        this.idNames = {
                            itemChoice: 'item-choice'
                        };

                        // Merge options with user options
                        this.config = (0, _utils.extend)(defaultConfig, userConfig);

                        if (this.config.renderSelectedChoices !== 'auto' && this.config.renderSelectedChoices !== 'always') {
                            if (!this.config.silent) {
                                console.warn('renderSelectedChoices: Possible values are \'auto\' and \'always\'. Falling back to \'auto\'.');
                            }
                            this.config.renderSelectedChoices = 'auto';
                        }

                        // Create data store
                        this.store = new _index2.default(this.render);

                        // State tracking
                        this.initialised = false;
                        this.currentState = {};
                        this.prevState = {};
                        this.currentValue = '';

                        // Retrieve triggering element (i.e. element with 'data-choice' trigger)
                        this.element = element;
                        this.passedElement = (0, _utils.isType)('String', element) ? document.querySelector(element) : element;

                        if (!this.passedElement) {
                            if (!this.config.silent) {
                                console.error('Passed element not found');
                            }
                            return false;
                        }

                        this.isTextElement = this.passedElement.type === 'text';
                        this.isSelectOneElement = this.passedElement.type === 'select-one';
                        this.isSelectMultipleElement = this.passedElement.type === 'select-multiple';
                        this.isSelectElement = this.isSelectOneElement || this.isSelectMultipleElement;
                        this.isValidElementType = this.isTextElement || this.isSelectElement;
                        this.isIe11 = !!(navigator.userAgent.match(/Trident/) && navigator.userAgent.match(/rv[ :]11/));
                        this.isScrollingOnIe = false;

                        if (this.config.shouldSortItems === true && this.isSelectOneElement) {
                            if (!this.config.silent) {
                                console.warn('shouldSortElements: Type of passed element is \'select-one\', falling back to false.');
                            }
                        }

                        this.highlightPosition = 0;
                        this.canSearch = this.config.searchEnabled;

                        this.placeholder = false;
                        if (!this.isSelectOneElement) {
                            this.placeholder = this.config.placeholder ? this.config.placeholderValue || this.passedElement.getAttribute('placeholder') : false;
                        }

                        // Assign preset choices from passed object
                        this.presetChoices = this.config.choices;

                        // Assign preset items from passed object first
                        this.presetItems = this.config.items;

                        // Then add any values passed from attribute
                        if (this.passedElement.value) {
                            this.presetItems = this.presetItems.concat(this.passedElement.value.split(this.config.delimiter));
                        }

                        // Set unique base Id
                        this.baseId = (0, _utils.generateId)(this.passedElement, 'choices-');

                        // Bind methods
                        this.render = this.render.bind(this);

                        // Bind event handlers
                        this._onFocus = this._onFocus.bind(this);
                        this._onBlur = this._onBlur.bind(this);
                        this._onKeyUp = this._onKeyUp.bind(this);
                        this._onKeyDown = this._onKeyDown.bind(this);
                        this._onClick = this._onClick.bind(this);
                        this._onTouchMove = this._onTouchMove.bind(this);
                        this._onTouchEnd = this._onTouchEnd.bind(this);
                        this._onMouseDown = this._onMouseDown.bind(this);
                        this._onMouseOver = this._onMouseOver.bind(this);
                        this._onPaste = this._onPaste.bind(this);
                        this._onInput = this._onInput.bind(this);

                        // Monitor touch taps/scrolls
                        this.wasTap = true;

                        // Cutting the mustard
                        var cuttingTheMustard = 'classList' in document.documentElement;
                        if (!cuttingTheMustard && !this.config.silent) {
                            console.error('Choices: Your browser doesn\'t support Choices');
                        }

                        var canInit = (0, _utils.isElement)(this.passedElement) && this.isValidElementType;

                        if (canInit) {
                            // If element has already been initialised with Choices
                            if (this.passedElement.getAttribute('data-choice') === 'active') {
                                return false;
                            }

                            // Let's go
                            this.init();
                        } else if (!this.config.silent) {
                            console.error('Incompatible input passed');
                        }
                    }

                    /* ========================================
                    =            Public functions            =
                    ======================================== */

                    /**
                     * Initialise Choices
                     * @return
                     * @public
                     */


                    _createClass(Choices, [{
                        key: 'init',
                        value: function init() {
                            if (this.initialised === true) {
                                return;
                            }

                            var callback = this.config.callbackOnInit;

                            // Set initialise flag
                            this.initialised = true;
                            // Create required elements
                            this._createTemplates();
                            // Generate input markup
                            this._createInput();
                            // Subscribe store to render method
                            this.store.subscribe(this.render);
                            // Render any items
                            this.render();
                            // Trigger event listeners
                            this._addEventListeners();

                            // Run callback if it is a function
                            if (callback && (0, _utils.isType)('Function', callback)) {
                                callback.call(this);
                            }
                        }

                        /**
                         * Destroy Choices and nullify values
                         * @return
                         * @public
                         */

                    }, {
                        key: 'destroy',
                        value: function destroy() {
                            if (this.initialised === false) {
                                return;
                            }

                            // Remove all event listeners
                            this._removeEventListeners();

                            // Reinstate passed element
                            this.passedElement.classList.remove(this.config.classNames.input, this.config.classNames.hiddenState);
                            this.passedElement.removeAttribute('tabindex');

                            // Recover original styles if any
                            var origStyle = this.passedElement.getAttribute('data-choice-orig-style');
                            if (origStyle) {
                                this.passedElement.removeAttribute('data-choice-orig-style');
                                this.passedElement.setAttribute('style', origStyle);
                            } else {
                                this.passedElement.removeAttribute('style');
                            }
                            this.passedElement.removeAttribute('aria-hidden');
                            this.passedElement.removeAttribute('data-choice');

                            // Re-assign values - this is weird, I know
                            this.passedElement.value = this.passedElement.value;

                            // Move passed element back to original position
                            this.containerOuter.parentNode.insertBefore(this.passedElement, this.containerOuter);
                            // Remove added elements
                            this.containerOuter.parentNode.removeChild(this.containerOuter);

                            // Clear data store
                            this.clearStore();

                            // Nullify instance-specific data
                            this.config.templates = null;

                            // Uninitialise
                            this.initialised = false;
                        }

                        /**
                         * Render group choices into a DOM fragment and append to choice list
                         * @param  {Array} groups    Groups to add to list
                         * @param  {Array} choices   Choices to add to groups
                         * @param  {DocumentFragment} fragment Fragment to add groups and options to (optional)
                         * @return {DocumentFragment} Populated options fragment
                         * @private
                         */

                    }, {
                        key: 'renderGroups',
                        value: function renderGroups(groups, choices, fragment) {
                            var _this = this;

                            var groupFragment = fragment || document.createDocumentFragment();
                            var filter = this.config.sortFilter;

                            // If sorting is enabled, filter groups
                            if (this.config.shouldSort) {
                                groups.sort(filter);
                            }

                            groups.forEach(function (group) {
                                // Grab options that are children of this group
                                var groupChoices = choices.filter(function (choice) {
                                    if (_this.isSelectOneElement) {
                                        return choice.groupId === group.id;
                                    }
                                    return choice.groupId === group.id && !choice.selected;
                                });

                                if (groupChoices.length >= 1) {
                                    var dropdownGroup = _this._getTemplate('choiceGroup', group);
                                    groupFragment.appendChild(dropdownGroup);
                                    _this.renderChoices(groupChoices, groupFragment, true);
                                }
                            });

                            return groupFragment;
                        }

                        /**
                         * Render choices into a DOM fragment and append to choice list
                         * @param  {Array} choices    Choices to add to list
                         * @param  {DocumentFragment} fragment Fragment to add choices to (optional)
                         * @return {DocumentFragment} Populated choices fragment
                         * @private
                         */

                    }, {
                        key: 'renderChoices',
                        value: function renderChoices(choices, fragment) {
                            var _this2 = this;

                            var withinGroup = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

                            // Create a fragment to store our list items (so we don't have to update the DOM for each item)
                            var choicesFragment = fragment || document.createDocumentFragment();
                            var _config = this.config,
                                renderSelectedChoices = _config.renderSelectedChoices,
                                searchResultLimit = _config.searchResultLimit,
                                renderChoiceLimit = _config.renderChoiceLimit;

                            var filter = this.isSearching ? _utils.sortByScore : this.config.sortFilter;
                            var appendChoice = function appendChoice(choice) {
                                var shouldRender = renderSelectedChoices === 'auto' ? _this2.isSelectOneElement || !choice.selected : true;
                                if (shouldRender) {
                                    var dropdownItem = _this2._getTemplate('choice', choice);
                                    choicesFragment.appendChild(dropdownItem);
                                }
                            };

                            var rendererableChoices = choices;

                            if (renderSelectedChoices === 'auto' && !this.isSelectOneElement) {
                                rendererableChoices = choices.filter(function (choice) {
                                    return !choice.selected;
                                });
                            }

                            // Split array into placeholders and "normal" choices

                            var _rendererableChoices$ = rendererableChoices.reduce(function (acc, choice) {
                                if (choice.placeholder) {
                                    acc.placeholderChoices.push(choice);
                                } else {
                                    acc.normalChoices.push(choice);
                                }
                                return acc;
                            }, { placeholderChoices: [], normalChoices: [] }),
                                placeholderChoices = _rendererableChoices$.placeholderChoices,
                                normalChoices = _rendererableChoices$.normalChoices;

                            // If sorting is enabled or the user is searching, filter choices


                            if (this.config.shouldSort || this.isSearching) {
                                normalChoices.sort(filter);
                            }

                            var choiceLimit = rendererableChoices.length;

                            // Prepend placeholeder
                            var sortedChoices = [].concat(_toConsumableArray(placeholderChoices), _toConsumableArray(normalChoices));

                            if (this.isSearching) {
                                choiceLimit = searchResultLimit;
                            } else if (renderChoiceLimit > 0 && !withinGroup) {
                                choiceLimit = renderChoiceLimit;
                            }

                            // Add each choice to dropdown within range
                            for (var i = 0; i < choiceLimit; i += 1) {
                                if (sortedChoices[i]) {
                                    appendChoice(sortedChoices[i]);
                                }
                            }

                            return choicesFragment;
                        }

                        /**
                         * Render items into a DOM fragment and append to items list
                         * @param  {Array} items    Items to add to list
                         * @param  {DocumentFragment} [fragment] Fragment to add items to (optional)
                         * @return
                         * @private
                         */

                    }, {
                        key: 'renderItems',
                        value: function renderItems(items) {
                            var _this3 = this;

                            var fragment = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

                            // Create fragment to add elements to
                            var itemListFragment = fragment || document.createDocumentFragment();

                            // If sorting is enabled, filter items
                            if (this.config.shouldSortItems && !this.isSelectOneElement) {
                                items.sort(this.config.sortFilter);
                            }

                            if (this.isTextElement) {
                                // Simplify store data to just values
                                var itemsFiltered = this.store.getItemsReducedToValues(items);
                                var itemsFilteredString = itemsFiltered.join(this.config.delimiter);
                                // Update the value of the hidden input
                                this.passedElement.setAttribute('value', itemsFilteredString);
                                this.passedElement.value = itemsFilteredString;
                            } else {
                                var selectedOptionsFragment = document.createDocumentFragment();

                                // Add each list item to list
                                items.forEach(function (item) {
                                    // Create a standard select option
                                    var option = _this3._getTemplate('option', item);
                                    // Append it to fragment
                                    selectedOptionsFragment.appendChild(option);
                                });

                                // Update selected choices
                                this.passedElement.innerHTML = '';
                                this.passedElement.appendChild(selectedOptionsFragment);
                            }

                            // Add each list item to list
                            items.forEach(function (item) {
                                // Create new list element
                                var listItem = _this3._getTemplate('item', item);
                                // Append it to list
                                itemListFragment.appendChild(listItem);
                            });

                            return itemListFragment;
                        }

                        /**
                         * Render DOM with values
                         * @return
                         * @private
                         */

                    }, {
                        key: 'render',
                        value: function render() {
                            this.currentState = this.store.getState();

                            // Only render if our state has actually changed
                            if (this.currentState !== this.prevState) {
                                // Choices
                                if (this.currentState.choices !== this.prevState.choices || this.currentState.groups !== this.prevState.groups || this.currentState.items !== this.prevState.items) {
                                    if (this.isSelectElement) {
                                        // Get active groups/choices
                                        var activeGroups = this.store.getGroupsFilteredByActive();
                                        var activeChoices = this.store.getChoicesFilteredByActive();

                                        var choiceListFragment = document.createDocumentFragment();

                                        // Clear choices
                                        this.choiceList.innerHTML = '';

                                        // Scroll back to top of choices list
                                        if (this.config.resetScrollPosition) {
                                            this.choiceList.scrollTop = 0;
                                        }

                                        // If we have grouped options
                                        if (activeGroups.length >= 1 && this.isSearching !== true) {
                                            choiceListFragment = this.renderGroups(activeGroups, activeChoices, choiceListFragment);
                                        } else if (activeChoices.length >= 1) {
                                            choiceListFragment = this.renderChoices(activeChoices, choiceListFragment);
                                        }

                                        var activeItems = this.store.getItemsFilteredByActive();
                                        var canAddItem = this._canAddItem(activeItems, this.input.value);

                                        // If we have choices to show
                                        if (choiceListFragment.childNodes && choiceListFragment.childNodes.length > 0) {
                                            // ...and we can select them
                                            if (canAddItem.response) {
                                                // ...append them and highlight the first choice
                                                this.choiceList.appendChild(choiceListFragment);
                                                this._highlightChoice();
                                            } else {
                                                // ...otherwise show a notice
                                                this.choiceList.appendChild(this._getTemplate('notice', canAddItem.notice));
                                            }
                                        } else {
                                            // Otherwise show a notice
                                            var dropdownItem = void 0;
                                            var notice = void 0;

                                            if (this.isSearching) {
                                                notice = (0, _utils.isType)('Function', this.config.noResultsText) ? this.config.noResultsText() : this.config.noResultsText;

                                                dropdownItem = this._getTemplate('notice', notice, 'no-results');
                                            } else {
                                                notice = (0, _utils.isType)('Function', this.config.noChoicesText) ? this.config.noChoicesText() : this.config.noChoicesText;

                                                dropdownItem = this._getTemplate('notice', notice, 'no-choices');
                                            }

                                            this.choiceList.appendChild(dropdownItem);
                                        }
                                    }
                                }

                                // Items
                                if (this.currentState.items !== this.prevState.items) {
                                    // Get active items (items that can be selected)
                                    var _activeItems = this.store.getItemsFilteredByActive();

                                    // Clear list
                                    this.itemList.innerHTML = '';

                                    if (_activeItems && _activeItems) {
                                        // Create a fragment to store our list items
                                        // (so we don't have to update the DOM for each item)
                                        var itemListFragment = this.renderItems(_activeItems);

                                        // If we have items to add
                                        if (itemListFragment.childNodes) {
                                            // Update list
                                            this.itemList.appendChild(itemListFragment);
                                        }
                                    }
                                }

                                this.prevState = this.currentState;
                            }
                        }

                        /**
                         * Select item (a selected item can be deleted)
                         * @param  {Element} item Element to select
                         * @param  {Boolean} [runEvent=true] Whether to trigger 'highlightItem' event
                         * @return {Object} Class instance
                         * @public
                         */

                    }, {
                        key: 'highlightItem',
                        value: function highlightItem(item) {
                            var runEvent = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

                            if (!item) {
                                return this;
                            }

                            var id = item.id;
                            var groupId = item.groupId;
                            var group = groupId >= 0 ? this.store.getGroupById(groupId) : null;

                            this.store.dispatch((0, _index3.highlightItem)(id, true));

                            if (runEvent) {
                                if (group && group.value) {
                                    (0, _utils.triggerEvent)(this.passedElement, 'highlightItem', {
                                        id: id,
                                        value: item.value,
                                        label: item.label,
                                        groupValue: group.value
                                    });
                                } else {
                                    (0, _utils.triggerEvent)(this.passedElement, 'highlightItem', {
                                        id: id,
                                        value: item.value,
                                        label: item.label
                                    });
                                }
                            }

                            return this;
                        }

                        /**
                         * Deselect item
                         * @param  {Element} item Element to de-select
                         * @return {Object} Class instance
                         * @public
                         */

                    }, {
                        key: 'unhighlightItem',
                        value: function unhighlightItem(item) {
                            if (!item) {
                                return this;
                            }

                            var id = item.id;
                            var groupId = item.groupId;
                            var group = groupId >= 0 ? this.store.getGroupById(groupId) : null;

                            this.store.dispatch((0, _index3.highlightItem)(id, false));

                            if (group && group.value) {
                                (0, _utils.triggerEvent)(this.passedElement, 'unhighlightItem', {
                                    id: id,
                                    value: item.value,
                                    label: item.label,
                                    groupValue: group.value
                                });
                            } else {
                                (0, _utils.triggerEvent)(this.passedElement, 'unhighlightItem', {
                                    id: id,
                                    value: item.value,
                                    label: item.label
                                });
                            }

                            return this;
                        }

                        /**
                         * Highlight items within store
                         * @return {Object} Class instance
                         * @public
                         */

                    }, {
                        key: 'highlightAll',
                        value: function highlightAll() {
                            var _this4 = this;

                            var items = this.store.getItems();
                            items.forEach(function (item) {
                                return _this4.highlightItem(item);
                            });
                            return this;
                        }

                        /**
                         * Deselect items within store
                         * @return {Object} Class instance
                         * @public
                         */

                    }, {
                        key: 'unhighlightAll',
                        value: function unhighlightAll() {
                            var _this5 = this;

                            var items = this.store.getItems();
                            items.forEach(function (item) {
                                return _this5.unhighlightItem(item);
                            });
                            return this;
                        }

                        /**
                         * Remove an item from the store by its value
                         * @param  {String} value Value to search for
                         * @return {Object} Class instance
                         * @public
                         */

                    }, {
                        key: 'removeItemsByValue',
                        value: function removeItemsByValue(value) {
                            var _this6 = this;

                            if (!value || !(0, _utils.isType)('String', value)) {
                                return this;
                            }

                            var items = this.store.getItemsFilteredByActive();

                            items.forEach(function (item) {
                                if (item.value === value) {
                                    _this6._removeItem(item);
                                }
                            });

                            return this;
                        }

                        /**
                         * Remove all items from store array
                         * @note Removed items are soft deleted
                         * @param  {Number} excludedId Optionally exclude item by ID
                         * @return {Object} Class instance
                         * @public
                         */

                    }, {
                        key: 'removeActiveItems',
                        value: function removeActiveItems(excludedId) {
                            var _this7 = this;

                            var items = this.store.getItemsFilteredByActive();

                            items.forEach(function (item) {
                                if (item.active && excludedId !== item.id) {
                                    _this7._removeItem(item);
                                }
                            });

                            return this;
                        }

                        /**
                         * Remove all selected items from store
                         * @note Removed items are soft deleted
                         * @return {Object} Class instance
                         * @public
                         */

                    }, {
                        key: 'removeHighlightedItems',
                        value: function removeHighlightedItems() {
                            var _this8 = this;

                            var runEvent = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

                            var items = this.store.getItemsFilteredByActive();

                            items.forEach(function (item) {
                                if (item.highlighted && item.active) {
                                    _this8._removeItem(item);
                                    // If this action was performed by the user
                                    // trigger the event
                                    if (runEvent) {
                                        _this8._triggerChange(item.value);
                                    }
                                }
                            });

                            return this;
                        }

                        /**
                         * Show dropdown to user by adding active state class
                         * @return {Object} Class instance
                         * @public
                         */

                    }, {
                        key: 'showDropdown',
                        value: function showDropdown() {
                            var focusInput = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

                            var body = document.body;
                            var html = document.documentElement;
                            var winHeight = Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight);

                            this.containerOuter.classList.add(this.config.classNames.openState);
                            this.containerOuter.setAttribute('aria-expanded', 'true');
                            this.dropdown.classList.add(this.config.classNames.activeState);
                            this.dropdown.setAttribute('aria-expanded', 'true');

                            var dimensions = this.dropdown.getBoundingClientRect();
                            var dropdownPos = Math.ceil(dimensions.top + window.scrollY + this.dropdown.offsetHeight);

                            // If flip is enabled and the dropdown bottom position is
                            // greater than the window height flip the dropdown.
                            var shouldFlip = false;
                            if (this.config.position === 'auto') {
                                shouldFlip = dropdownPos >= winHeight;
                            } else if (this.config.position === 'top') {
                                shouldFlip = true;
                            }

                            if (shouldFlip) {
                                this.containerOuter.classList.add(this.config.classNames.flippedState);
                            }

                            // Optionally focus the input if we have a search input
                            if (focusInput && this.canSearch && document.activeElement !== this.input) {
                                this.input.focus();
                            }

                            (0, _utils.triggerEvent)(this.passedElement, 'showDropdown', {});

                            return this;
                        }

                        /**
                         * Hide dropdown from user
                         * @return {Object} Class instance
                         * @public
                         */

                    }, {
                        key: 'hideDropdown',
                        value: function hideDropdown() {
                            var blurInput = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

                            // A dropdown flips if it does not have space within the page
                            var isFlipped = this.containerOuter.classList.contains(this.config.classNames.flippedState);

                            this.containerOuter.classList.remove(this.config.classNames.openState);
                            this.containerOuter.setAttribute('aria-expanded', 'false');
                            this.dropdown.classList.remove(this.config.classNames.activeState);
                            this.dropdown.setAttribute('aria-expanded', 'false');
                            // IE11 ignores aria-label and blocks virtual keyboard
                            // if aria-activedescendant is set without a dropdown
                            this.input.removeAttribute('aria-activedescendant');
                            this.containerOuter.removeAttribute('aria-activedescendant');

                            if (isFlipped) {
                                this.containerOuter.classList.remove(this.config.classNames.flippedState);
                            }

                            // Optionally blur the input if we have a search input
                            if (blurInput && this.canSearch && document.activeElement === this.input) {
                                this.input.blur();
                            }

                            (0, _utils.triggerEvent)(this.passedElement, 'hideDropdown', {});

                            return this;
                        }

                        /**
                         * Determine whether to hide or show dropdown based on its current state
                         * @return {Object} Class instance
                         * @public
                         */

                    }, {
                        key: 'toggleDropdown',
                        value: function toggleDropdown() {
                            var hasActiveDropdown = this.dropdown.classList.contains(this.config.classNames.activeState);
                            if (hasActiveDropdown) {
                                this.hideDropdown();
                            } else {
                                this.showDropdown(true);
                            }

                            return this;
                        }

                        /**
                         * Get value(s) of input (i.e. inputted items (text) or selected choices (select))
                         * @param {Boolean} valueOnly Get only values of selected items, otherwise return selected items
                         * @return {Array/String} selected value (select-one) or
                         *                        array of selected items (inputs & select-multiple)
                         * @public
                         */

                    }, {
                        key: 'getValue',
                        value: function getValue() {
                            var _this9 = this;

                            var valueOnly = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

                            var items = this.store.getItemsFilteredByActive();
                            var selectedItems = [];

                            items.forEach(function (item) {
                                if (_this9.isTextElement) {
                                    selectedItems.push(valueOnly ? item.value : item);
                                } else if (item.active) {
                                    selectedItems.push(valueOnly ? item.value : item);
                                }
                            });

                            if (this.isSelectOneElement) {
                                return selectedItems[0];
                            }

                            return selectedItems;
                        }

                        /**
                         * Set value of input. If the input is a select box, a choice will
                         * be created and selected otherwise an item will created directly.
                         * @param  {Array}   args  Array of value objects or value strings
                         * @return {Object} Class instance
                         * @public
                         */

                    }, {
                        key: 'setValue',
                        value: function setValue(args) {
                            var _this10 = this;

                            if (!this.initialised) {
                                return this;
                            }

                            // Convert args to an iterable array
                            var values = [].concat(_toConsumableArray(args));
                            var handleValue = function handleValue(item) {
                                var itemType = (0, _utils.getType)(item);
                                if (itemType === 'Object') {
                                    if (!item.value) {
                                        return;
                                    }

                                    // If we are dealing with a select input, we need to create an option first
                                    // that is then selected. For text inputs we can just add items normally.
                                    if (!_this10.isTextElement) {
                                        _this10._addChoice(item.value, item.label, true, false, -1, item.customProperties, item.placeholder);
                                    } else {
                                        _this10._addItem(item.value, item.label, item.id, undefined, item.customProperties, item.placeholder);
                                    }
                                } else if (itemType === 'String') {
                                    if (!_this10.isTextElement) {
                                        _this10._addChoice(item, item, true, false, -1, null);
                                    } else {
                                        _this10._addItem(item);
                                    }
                                }
                            };

                            if (values.length > 1) {
                                values.forEach(function (value) {
                                    return handleValue(value);
                                });
                            } else {
                                handleValue(values[0]);
                            }

                            return this;
                        }

                        /**
                         * Select value of select box via the value of an existing choice
                         * @param {Array/String} value An array of strings of a single string
                         * @return {Object} Class instance
                         * @public
                         */

                    }, {
                        key: 'setValueByChoice',
                        value: function setValueByChoice(value) {
                            var _this11 = this;

                            if (this.isTextElement) {
                                return this;
                            }

                            var choices = this.store.getChoices();
                            // If only one value has been passed, convert to array
                            var choiceValue = (0, _utils.isType)('Array', value) ? value : [value];

                            // Loop through each value and
                            choiceValue.forEach(function (val) {
                                // Check 'value' property exists and the choice isn't already selected
                                var foundChoice = choices.find(function (choice) {
                                    return choice.value === val;
                                });

                                if (foundChoice) {
                                    if (!foundChoice.selected) {
                                        _this11._addItem(foundChoice.value, foundChoice.label, foundChoice.id, foundChoice.groupId, foundChoice.customProperties, foundChoice.placeholder, foundChoice.keyCode);
                                    } else if (!_this11.config.silent) {
                                        console.warn('Attempting to select choice already selected');
                                    }
                                } else if (!_this11.config.silent) {
                                    console.warn('Attempting to select choice that does not exist');
                                }
                            });
                            return this;
                        }

                        /**
                         * Direct populate choices
                         * @param  {Array} choices - Choices to insert
                         * @param  {String} value - Name of 'value' property
                         * @param  {String} label - Name of 'label' property
                         * @param  {Boolean} replaceChoices Whether existing choices should be removed
                         * @return {Object} Class instance
                         * @public
                         */

                    }, {
                        key: 'setChoices',
                        value: function setChoices(choices, value, label) {
                            var _this12 = this;

                            var replaceChoices = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;

                            if (!this.initialised || !this.isSelectElement || !(0, _utils.isType)('Array', choices) || !value) {
                                return this;
                            }

                            // Clear choices if needed
                            if (replaceChoices) {
                                this._clearChoices();
                            }

                            // Add choices if passed
                            if (choices && choices.length) {
                                this.containerOuter.classList.remove(this.config.classNames.loadingState);
                                choices.forEach(function (result) {
                                    if (result.choices) {
                                        _this12._addGroup(result, result.id || null, value, label);
                                    } else {
                                        _this12._addChoice(result[value], result[label], result.selected, result.disabled, undefined, result.customProperties, result.placeholder);
                                    }
                                });
                            }

                            return this;
                        }

                        /**
                         * Clear items,choices and groups
                         * @note Hard delete
                         * @return {Object} Class instance
                         * @public
                         */

                    }, {
                        key: 'clearStore',
                        value: function clearStore() {
                            this.store.dispatch((0, _index3.clearAll)());
                            return this;
                        }

                        /**
                         * Set value of input to blank
                         * @return {Object} Class instance
                         * @public
                         */

                    }, {
                        key: 'clearInput',
                        value: function clearInput() {
                            if (this.input.value) {
                                this.input.value = '';
                            }

                            if (!this.isSelectOneElement) {
                                this._setInputWidth();
                            }

                            if (!this.isTextElement && this.config.searchEnabled) {
                                this.isSearching = false;
                                this.store.dispatch((0, _index3.activateChoices)(true));
                            }

                            return this;
                        }

                        /**
                         * Enable interaction with Choices
                         * @return {Object} Class instance
                         */

                    }, {
                        key: 'enable',
                        value: function enable() {
                            if (!this.initialised) {
                                return this;
                            }

                            this.passedElement.disabled = false;
                            var isDisabled = this.containerOuter.classList.contains(this.config.classNames.disabledState);

                            if (isDisabled) {
                                this._addEventListeners();
                                this.passedElement.removeAttribute('disabled');
                                this.input.removeAttribute('disabled');
                                this.containerOuter.classList.remove(this.config.classNames.disabledState);
                                this.containerOuter.removeAttribute('aria-disabled');
                                if (this.isSelectOneElement) {
                                    this.containerOuter.setAttribute('tabindex', '0');
                                }
                            }

                            return this;
                        }

                        /**
                         * Disable interaction with Choices
                         * @return {Object} Class instance
                         * @public
                         */

                    }, {
                        key: 'disable',
                        value: function disable() {
                            if (!this.initialised) {
                                return this;
                            }

                            this.passedElement.disabled = true;
                            var isEnabled = !this.containerOuter.classList.contains(this.config.classNames.disabledState);

                            if (isEnabled) {
                                this._removeEventListeners();
                                this.passedElement.setAttribute('disabled', '');
                                this.input.setAttribute('disabled', '');
                                this.containerOuter.classList.add(this.config.classNames.disabledState);
                                this.containerOuter.setAttribute('aria-disabled', 'true');
                                if (this.isSelectOneElement) {
                                    this.containerOuter.setAttribute('tabindex', '-1');
                                }
                            }

                            return this;
                        }

                        /**
                         * Populate options via ajax callback
                         * @param  {Function} fn Function that actually makes an AJAX request
                         * @return {Object} Class instance
                         * @public
                         */

                    }, {
                        key: 'ajax',
                        value: function ajax(fn) {
                            var _this13 = this;

                            if (!this.initialised || !this.isSelectElement) {
                                return this;
                            }

                            // Show loading text
                            requestAnimationFrame(function () {
                                return _this13._handleLoadingState(true);
                            });
                            // Run callback
                            fn(this._ajaxCallback());

                            return this;
                        }

                        /* =====  End of Public functions  ====== */

                        /* =============================================
                        =                Private functions            =
                        ============================================= */

                        /**
                         * Call change callback
                         * @param  {String} value - last added/deleted/selected value
                         * @return
                         * @private
                         */

                    }, {
                        key: '_triggerChange',
                        value: function _triggerChange(value) {
                            if (!value) {
                                return;
                            }

                            (0, _utils.triggerEvent)(this.passedElement, 'change', {
                                value: value
                            });
                        }

                        /**
                         * Process enter/click of an item button
                         * @param {Array} activeItems The currently active items
                         * @param  {Element} element Button being interacted with
                         * @return
                         * @private
                         */

                    }, {
                        key: '_handleButtonAction',
                        value: function _handleButtonAction(activeItems, element) {
                            if (!activeItems || !element) {
                                return;
                            }

                            // If we are clicking on a button
                            if (this.config.removeItems && this.config.removeItemButton) {
                                var itemId = element.parentNode.getAttribute('data-id');
                                var itemToRemove = activeItems.find(function (item) {
                                    return item.id === parseInt(itemId, 10);
                                });

                                // Remove item associated with button
                                this._removeItem(itemToRemove);
                                this._triggerChange(itemToRemove.value);

                                if (this.isSelectOneElement) {
                                    this._selectPlaceholderChoice();
                                }
                            }
                        }

                        /**
                         * Select placeholder choice
                         */

                    }, {
                        key: '_selectPlaceholderChoice',
                        value: function _selectPlaceholderChoice() {
                            var placeholderChoice = this.store.getPlaceholderChoice();

                            if (placeholderChoice) {
                                this._addItem(placeholderChoice.value, placeholderChoice.label, placeholderChoice.id, placeholderChoice.groupId, null, placeholderChoice.placeholder);
                                this._triggerChange(placeholderChoice.value);
                            }
                        }

                        /**
                         * Process click of an item
                         * @param {Array} activeItems The currently active items
                         * @param  {Element} element Item being interacted with
                         * @param  {Boolean} hasShiftKey Whether the user has the shift key active
                         * @return
                         * @private
                         */

                    }, {
                        key: '_handleItemAction',
                        value: function _handleItemAction(activeItems, element) {
                            var _this14 = this;

                            var hasShiftKey = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

                            if (!activeItems || !element) {
                                return;
                            }

                            // If we are clicking on an item
                            if (this.config.removeItems && !this.isSelectOneElement) {
                                var passedId = element.getAttribute('data-id');

                                // We only want to select one item with a click
                                // so we deselect any items that aren't the target
                                // unless shift is being pressed
                                activeItems.forEach(function (item) {
                                    if (item.id === parseInt(passedId, 10) && !item.highlighted) {
                                        _this14.highlightItem(item);
                                    } else if (!hasShiftKey) {
                                        if (item.highlighted) {
                                            _this14.unhighlightItem(item);
                                        }
                                    }
                                });

                                // Focus input as without focus, a user cannot do anything with a
                                // highlighted item
                                if (document.activeElement !== this.input) {
                                    this.input.focus();
                                }
                            }
                        }

                        /**
                         * Process click of a choice
                         * @param {Array} activeItems The currently active items
                         * @param  {Element} element Choice being interacted with
                         * @return
                         */

                    }, {
                        key: '_handleChoiceAction',
                        value: function _handleChoiceAction(activeItems, element) {
                            if (!activeItems || !element) {
                                return;
                            }

                            // If we are clicking on an option
                            var id = element.getAttribute('data-id');
                            var choice = this.store.getChoiceById(id);
                            var passedKeyCode = activeItems[0] && activeItems[0].keyCode ? activeItems[0].keyCode : null;
                            var hasActiveDropdown = this.dropdown.classList.contains(this.config.classNames.activeState);

                            // Update choice keyCode
                            choice.keyCode = passedKeyCode;

                            (0, _utils.triggerEvent)(this.passedElement, 'choice', {
                                choice: choice
                            });

                            if (choice && !choice.selected && !choice.disabled) {
                                var canAddItem = this._canAddItem(activeItems, choice.value);

                                if (canAddItem.response) {
                                    this._addItem(choice.value, choice.label, choice.id, choice.groupId, choice.customProperties, choice.placeholder, choice.keyCode);
                                    this._triggerChange(choice.value);
                                }
                            }

                            this.clearInput();

                            // We wont to close the dropdown if we are dealing with a single select box
                            if (hasActiveDropdown && this.isSelectOneElement) {
                                this.hideDropdown();
                                this.containerOuter.focus();
                            }
                        }

                        /**
                         * Process back space event
                         * @param  {Array} activeItems items
                         * @return
                         * @private
                         */

                    }, {
                        key: '_handleBackspace',
                        value: function _handleBackspace(activeItems) {
                            if (this.config.removeItems && activeItems) {
                                var lastItem = activeItems[activeItems.length - 1];
                                var hasHighlightedItems = activeItems.some(function (item) {
                                    return item.highlighted;
                                });

                                // If editing the last item is allowed and there are not other selected items,
                                // we can edit the item value. Otherwise if we can remove items, remove all selected items
                                if (this.config.editItems && !hasHighlightedItems && lastItem) {
                                    this.input.value = lastItem.value;
                                    this._setInputWidth();
                                    this._removeItem(lastItem);
                                    this._triggerChange(lastItem.value);
                                } else {
                                    if (!hasHighlightedItems) {
                                        this.highlightItem(lastItem, false);
                                    }
                                    this.removeHighlightedItems(true);
                                }
                            }
                        }

                        /**
                         * Validates whether an item can be added by a user
                         * @param {Array} activeItems The currently active items
                         * @param  {String} value     Value of item to add
                         * @return {Object}           Response: Whether user can add item
                         *                            Notice: Notice show in dropdown
                         */

                    }, {
                        key: '_canAddItem',
                        value: function _canAddItem(activeItems, value) {
                            var canAddItem = true;
                            var notice = (0, _utils.isType)('Function', this.config.addItemText) ? this.config.addItemText(value) : this.config.addItemText;

                            if (this.isSelectMultipleElement || this.isTextElement) {
                                if (this.config.maxItemCount > 0 && this.config.maxItemCount <= activeItems.length) {
                                    // If there is a max entry limit and we have reached that limit
                                    // don't update
                                    canAddItem = false;
                                    notice = (0, _utils.isType)('Function', this.config.maxItemText) ? this.config.maxItemText(this.config.maxItemCount) : this.config.maxItemText;
                                }
                            }

                            if (this.isTextElement && this.config.addItems && canAddItem && this.config.regexFilter) {
                                // If a user has supplied a regular expression filter
                                // determine whether we can update based on whether
                                // our regular expression passes
                                canAddItem = (0, _utils.regexFilter)(value, this.config.regexFilter);
                            }

                            // If no duplicates are allowed, and the value already exists
                            // in the array
                            var isUnique = !activeItems.some(function (item) {
                                if ((0, _utils.isType)('String', value)) {
                                    return item.value === value.trim();
                                }

                                return item.value === value;
                            });

                            if (!isUnique && !this.config.duplicateItems && !this.isSelectOneElement && canAddItem) {
                                canAddItem = false;
                                notice = (0, _utils.isType)('Function', this.config.uniqueItemText) ? this.config.uniqueItemText(value) : this.config.uniqueItemText;
                            }

                            return {
                                response: canAddItem,
                                notice: notice
                            };
                        }

                        /**
                         * Apply or remove a loading state to the component.
                         * @param {Boolean} isLoading default value set to 'true'.
                         * @return
                         * @private
                         */

                    }, {
                        key: '_handleLoadingState',
                        value: function _handleLoadingState() {
                            var isLoading = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;

                            var placeholderItem = this.itemList.querySelector('.' + this.config.classNames.placeholder);
                            if (isLoading) {
                                this.containerOuter.classList.add(this.config.classNames.loadingState);
                                this.containerOuter.setAttribute('aria-busy', 'true');
                                if (this.isSelectOneElement) {
                                    if (!placeholderItem) {
                                        placeholderItem = this._getTemplate('placeholder', this.config.loadingText);
                                        this.itemList.appendChild(placeholderItem);
                                    } else {
                                        placeholderItem.innerHTML = this.config.loadingText;
                                    }
                                } else {
                                    this.input.placeholder = this.config.loadingText;
                                }
                            } else {
                                // Remove loading states/text
                                this.containerOuter.classList.remove(this.config.classNames.loadingState);

                                if (this.isSelectOneElement) {
                                    placeholderItem.innerHTML = this.placeholder || '';
                                } else {
                                    this.input.placeholder = this.placeholder || '';
                                }
                            }
                        }

                        /**
                         * Retrieve the callback used to populate component's choices in an async way.
                         * @returns {Function} The callback as a function.
                         * @private
                         */

                    }, {
                        key: '_ajaxCallback',
                        value: function _ajaxCallback() {
                            var _this15 = this;

                            return function (results, value, label) {
                                if (!results || !value) {
                                    return;
                                }

                                var parsedResults = (0, _utils.isType)('Object', results) ? [results] : results;

                                if (parsedResults && (0, _utils.isType)('Array', parsedResults) && parsedResults.length) {
                                    // Remove loading states/text
                                    _this15._handleLoadingState(false);
                                    // Add each result as a choice
                                    parsedResults.forEach(function (result) {
                                        if (result.choices) {
                                            var groupId = result.id || null;
                                            _this15._addGroup(result, groupId, value, label);
                                        } else {
                                            _this15._addChoice(result[value], result[label], result.selected, result.disabled, undefined, result.customProperties, result.placeholder);
                                        }
                                    });

                                    if (_this15.isSelectOneElement) {
                                        _this15._selectPlaceholderChoice();
                                    }
                                } else {
                                    // No results, remove loading state
                                    _this15._handleLoadingState(false);
                                }

                                _this15.containerOuter.removeAttribute('aria-busy');
                            };
                        }

                        /**
                         * Filter choices based on search value
                         * @param  {String} value Value to filter by
                         * @return
                         * @private
                         */

                    }, {
                        key: '_searchChoices',
                        value: function _searchChoices(value) {
                            var newValue = (0, _utils.isType)('String', value) ? value.trim() : value;
                            var currentValue = (0, _utils.isType)('String', this.currentValue) ? this.currentValue.trim() : this.currentValue;

                            // If new value matches the desired length and is not the same as the current value with a space
                            if (newValue.length >= 1 && newValue !== currentValue + ' ') {
                                var haystack = this.store.getSearchableChoices();
                                var needle = newValue;
                                var keys = (0, _utils.isType)('Array', this.config.searchFields) ? this.config.searchFields : [this.config.searchFields];
                                var options = Object.assign(this.config.fuseOptions, { keys: keys });
                                var fuse = new _fuse2.default(haystack, options);
                                var results = fuse.search(needle);

                                this.currentValue = newValue;
                                this.highlightPosition = 0;
                                this.isSearching = true;
                                this.store.dispatch((0, _index3.filterChoices)(results));

                                return results.length;
                            }

                            return 0;
                        }

                        /**
                         * Determine the action when a user is searching
                         * @param  {String} value Value entered by user
                         * @return
                         * @private
                         */

                    }, {
                        key: '_handleSearch',
                        value: function _handleSearch(value) {
                            if (!value) {
                                return;
                            }

                            var choices = this.store.getChoices();
                            var hasUnactiveChoices = choices.some(function (option) {
                                return !option.active;
                            });

                            // Run callback if it is a function
                            if (this.input === document.activeElement) {
                                // Check that we have a value to search and the input was an alphanumeric character
                                if (value && value.length >= this.config.searchFloor) {
                                    var resultCount = 0;
                                    // Check flag to filter search input
                                    if (this.config.searchChoices) {
                                        // Filter available choices
                                        resultCount = this._searchChoices(value);
                                    }
                                    // Trigger search event
                                    (0, _utils.triggerEvent)(this.passedElement, 'search', {
                                        value: value,
                                        resultCount: resultCount
                                    });
                                } else if (hasUnactiveChoices) {
                                    // Otherwise reset choices to active
                                    this.isSearching = false;
                                    this.store.dispatch((0, _index3.activateChoices)(true));
                                }
                            }
                        }

                        /**
                         * Trigger event listeners
                         * @return
                         * @private
                         */

                    }, {
                        key: '_addEventListeners',
                        value: function _addEventListeners() {
                            document.addEventListener('keyup', this._onKeyUp);
                            document.addEventListener('keydown', this._onKeyDown);
                            document.addEventListener('click', this._onClick);
                            document.addEventListener('touchmove', this._onTouchMove);
                            document.addEventListener('touchend', this._onTouchEnd);
                            document.addEventListener('mousedown', this._onMouseDown);
                            document.addEventListener('mouseover', this._onMouseOver);

                            if (this.isSelectOneElement) {
                                this.containerOuter.addEventListener('focus', this._onFocus);
                                this.containerOuter.addEventListener('blur', this._onBlur);
                            }

                            this.input.addEventListener('input', this._onInput);
                            this.input.addEventListener('paste', this._onPaste);
                            this.input.addEventListener('focus', this._onFocus);
                            this.input.addEventListener('blur', this._onBlur);
                        }

                        /**
                         * Remove event listeners
                         * @return
                         * @private
                         */

                    }, {
                        key: '_removeEventListeners',
                        value: function _removeEventListeners() {
                            document.removeEventListener('keyup', this._onKeyUp);
                            document.removeEventListener('keydown', this._onKeyDown);
                            document.removeEventListener('click', this._onClick);
                            document.removeEventListener('touchmove', this._onTouchMove);
                            document.removeEventListener('touchend', this._onTouchEnd);
                            document.removeEventListener('mousedown', this._onMouseDown);
                            document.removeEventListener('mouseover', this._onMouseOver);

                            if (this.isSelectOneElement) {
                                this.containerOuter.removeEventListener('focus', this._onFocus);
                                this.containerOuter.removeEventListener('blur', this._onBlur);
                            }

                            this.input.removeEventListener('input', this._onInput);
                            this.input.removeEventListener('paste', this._onPaste);
                            this.input.removeEventListener('focus', this._onFocus);
                            this.input.removeEventListener('blur', this._onBlur);
                        }

                        /**
                         * Set the correct input width based on placeholder
                         * value or input value
                         * @return
                         */

                    }, {
                        key: '_setInputWidth',
                        value: function _setInputWidth() {
                            if (this.placeholder) {
                                // If there is a placeholder, we only want to set the width of the input when it is a greater
                                // length than 75% of the placeholder. This stops the input jumping around.
                                if (this.input.value && this.input.value.length >= this.placeholder.length / 1.25) {
                                    this.input.style.width = (0, _utils.getWidthOfInput)(this.input);
                                }
                            } else {
                                // If there is no placeholder, resize input to contents
                                this.input.style.width = (0, _utils.getWidthOfInput)(this.input);
                            }
                        }

                        /**
                         * Key down event
                         * @param  {Object} e Event
                         * @return
                         */

                    }, {
                        key: '_onKeyDown',
                        value: function _onKeyDown(e) {
                            var _this16 = this,
                                _keyDownActions;

                            if (e.target !== this.input && !this.containerOuter.contains(e.target)) {
                                return;
                            }

                            var target = e.target;
                            var activeItems = this.store.getItemsFilteredByActive();
                            var hasFocusedInput = this.input === document.activeElement;
                            var hasActiveDropdown = this.dropdown.classList.contains(this.config.classNames.activeState);
                            var hasItems = this.itemList && this.itemList.children;
                            var keyString = String.fromCharCode(e.keyCode);

                            var backKey = 46;
                            var deleteKey = 8;
                            var enterKey = 13;
                            var aKey = 65;
                            var escapeKey = 27;
                            var upKey = 38;
                            var downKey = 40;
                            var pageUpKey = 33;
                            var pageDownKey = 34;
                            var ctrlDownKey = e.ctrlKey || e.metaKey;

                            // If a user is typing and the dropdown is not active
                            if (!this.isTextElement && /[a-zA-Z0-9-_ ]/.test(keyString) && !hasActiveDropdown) {
                                this.showDropdown(true);
                            }

                            this.canSearch = this.config.searchEnabled;

                            var onAKey = function onAKey() {
                                // If CTRL + A or CMD + A have been pressed and there are items to select
                                if (ctrlDownKey && hasItems) {
                                    _this16.canSearch = false;
                                    if (_this16.config.removeItems && !_this16.input.value && _this16.input === document.activeElement) {
                                        // Highlight items
                                        _this16.highlightAll();
                                    }
                                }
                            };

                            var onEnterKey = function onEnterKey() {
                                // If enter key is pressed and the input has a value
                                if (_this16.isTextElement && target.value) {
                                    var value = _this16.input.value;
                                    var canAddItem = _this16._canAddItem(activeItems, value);

                                    // All is good, add
                                    if (canAddItem.response) {
                                        if (hasActiveDropdown) {
                                            _this16.hideDropdown();
                                        }
                                        _this16._addItem(value);
                                        _this16._triggerChange(value);
                                        _this16.clearInput();
                                    }
                                }

                                if (target.hasAttribute('data-button')) {
                                    _this16._handleButtonAction(activeItems, target);
                                    e.preventDefault();
                                }

                                if (hasActiveDropdown) {
                                    e.preventDefault();
                                    var highlighted = _this16.dropdown.querySelector('.' + _this16.config.classNames.highlightedState);

                                    // If we have a highlighted choice
                                    if (highlighted) {
                                        // add enter keyCode value
                                        if (activeItems[0]) {
                                            activeItems[0].keyCode = enterKey;
                                        }
                                        _this16._handleChoiceAction(activeItems, highlighted);
                                    }
                                } else if (_this16.isSelectOneElement && !hasActiveDropdown) {
                                    // Open single select dropdown if it's not active
                                    _this16.showDropdown(true);
                                    e.preventDefault();
                                }
                            };

                            var onEscapeKey = function onEscapeKey() {
                                if (hasActiveDropdown) {
                                    _this16.toggleDropdown();
                                    _this16.containerOuter.focus();
                                }
                            };

                            var onDirectionKey = function onDirectionKey() {
                                // If up or down key is pressed, traverse through options
                                if (hasActiveDropdown || _this16.isSelectOneElement) {
                                    // Show dropdown if focus
                                    if (!hasActiveDropdown) {
                                        _this16.showDropdown(true);
                                    }

                                    _this16.canSearch = false;

                                    var directionInt = e.keyCode === downKey || e.keyCode === pageDownKey ? 1 : -1;
                                    var skipKey = e.metaKey || e.keyCode === pageDownKey || e.keyCode === pageUpKey;

                                    var nextEl = void 0;
                                    if (skipKey) {
                                        if (directionInt > 0) {
                                            nextEl = Array.from(_this16.dropdown.querySelectorAll('[data-choice-selectable]')).pop();
                                        } else {
                                            nextEl = _this16.dropdown.querySelector('[data-choice-selectable]');
                                        }
                                    } else {
                                        var currentEl = _this16.dropdown.querySelector('.' + _this16.config.classNames.highlightedState);
                                        if (currentEl) {
                                            nextEl = (0, _utils.getAdjacentEl)(currentEl, '[data-choice-selectable]', directionInt);
                                        } else {
                                            nextEl = _this16.dropdown.querySelector('[data-choice-selectable]');
                                        }
                                    }

                                    if (nextEl) {
                                        // We prevent default to stop the cursor moving
                                        // when pressing the arrow
                                        if (!(0, _utils.isScrolledIntoView)(nextEl, _this16.choiceList, directionInt)) {
                                            _this16._scrollToChoice(nextEl, directionInt);
                                        }
                                        _this16._highlightChoice(nextEl);
                                    }

                                    // Prevent default to maintain cursor position whilst
                                    // traversing dropdown options
                                    e.preventDefault();
                                }
                            };

                            var onDeleteKey = function onDeleteKey() {
                                // If backspace or delete key is pressed and the input has no value
                                if (hasFocusedInput && !e.target.value && !_this16.isSelectOneElement) {
                                    _this16._handleBackspace(activeItems);
                                    e.preventDefault();
                                }
                            };

                            // Map keys to key actions
                            var keyDownActions = (_keyDownActions = {}, _defineProperty(_keyDownActions, aKey, onAKey), _defineProperty(_keyDownActions, enterKey, onEnterKey), _defineProperty(_keyDownActions, escapeKey, onEscapeKey), _defineProperty(_keyDownActions, upKey, onDirectionKey), _defineProperty(_keyDownActions, pageUpKey, onDirectionKey), _defineProperty(_keyDownActions, downKey, onDirectionKey), _defineProperty(_keyDownActions, pageDownKey, onDirectionKey), _defineProperty(_keyDownActions, deleteKey, onDeleteKey), _defineProperty(_keyDownActions, backKey, onDeleteKey), _keyDownActions);

                            // If keycode has a function, run it
                            if (keyDownActions[e.keyCode]) {
                                keyDownActions[e.keyCode]();
                            }
                        }

                        /**
                         * Key up event
                         * @param  {Object} e Event
                         * @return
                         * @private
                         */

                    }, {
                        key: '_onKeyUp',
                        value: function _onKeyUp(e) {
                            if (e.target !== this.input) {
                                return;
                            }

                            var value = this.input.value;
                            var activeItems = this.store.getItemsFilteredByActive();
                            var canAddItem = this._canAddItem(activeItems, value);

                            // We are typing into a text input and have a value, we want to show a dropdown
                            // notice. Otherwise hide the dropdown
                            if (this.isTextElement) {
                                var hasActiveDropdown = this.dropdown.classList.contains(this.config.classNames.activeState);

                                if (value) {
                                    if (canAddItem.notice) {
                                        var dropdownItem = this._getTemplate('notice', canAddItem.notice);
                                        this.dropdown.innerHTML = dropdownItem.outerHTML;
                                    }

                                    if (canAddItem.response === true) {
                                        if (!hasActiveDropdown) {
                                            this.showDropdown();
                                        }
                                    } else if (!canAddItem.notice && hasActiveDropdown) {
                                        this.hideDropdown();
                                    }
                                } else if (hasActiveDropdown) {
                                    this.hideDropdown();
                                }
                            } else {
                                var backKey = 46;
                                var deleteKey = 8;

                                // If user has removed value...
                                if ((e.keyCode === backKey || e.keyCode === deleteKey) && !e.target.value) {
                                    // ...and it is a multiple select input, activate choices (if searching)
                                    if (!this.isTextElement && this.isSearching) {
                                        this.isSearching = false;
                                        this.store.dispatch((0, _index3.activateChoices)(true));
                                    }
                                } else if (this.canSearch && canAddItem.response) {
                                    this._handleSearch(this.input.value);
                                }
                            }
                            // Re-establish canSearch value from changes in _onKeyDown
                            this.canSearch = this.config.searchEnabled;
                        }

                        /**
                         * Input event
                         * @return
                         * @private
                         */

                    }, {
                        key: '_onInput',
                        value: function _onInput() {
                            if (!this.isSelectOneElement) {
                                this._setInputWidth();
                            }
                        }

                        /**
                         * Touch move event
                         * @return
                         * @private
                         */

                    }, {
                        key: '_onTouchMove',
                        value: function _onTouchMove() {
                            if (this.wasTap === true) {
                                this.wasTap = false;
                            }
                        }

                        /**
                         * Touch end event
                         * @param  {Object} e Event
                         * @return
                         * @private
                         */

                    }, {
                        key: '_onTouchEnd',
                        value: function _onTouchEnd(e) {
                            var target = e.target || e.touches[0].target;
                            var hasActiveDropdown = this.dropdown.classList.contains(this.config.classNames.activeState);

                            // If a user tapped within our container...
                            if (this.wasTap === true && this.containerOuter.contains(target)) {
                                // ...and we aren't dealing with a single select box, show dropdown/focus input
                                if ((target === this.containerOuter || target === this.containerInner) && !this.isSelectOneElement) {
                                    if (this.isTextElement) {
                                        // If text element, we only want to focus the input (if it isn't already)
                                        if (document.activeElement !== this.input) {
                                            this.input.focus();
                                        }
                                    } else if (!hasActiveDropdown) {
                                        // If a select box, we want to show the dropdown
                                        this.showDropdown(true);
                                    }
                                }
                                // Prevents focus event firing
                                e.stopPropagation();
                            }

                            this.wasTap = true;
                        }

                        /**
                         * Mouse down event
                         * @param  {Object} e Event
                         * @return
                         * @private
                         */

                    }, {
                        key: '_onMouseDown',
                        value: function _onMouseDown(e) {
                            var target = e.target;

                            // If we have our mouse down on the scrollbar and are on IE11...
                            if (target === this.choiceList && this.isIe11) {
                                this.isScrollingOnIe = true;
                            }

                            if (this.containerOuter.contains(target) && target !== this.input) {
                                var activeItems = this.store.getItemsFilteredByActive();
                                var hasShiftKey = e.shiftKey;

                                var buttonTarget = (0, _utils.findAncestorByAttrName)(target, 'data-button');
                                var itemTarget = (0, _utils.findAncestorByAttrName)(target, 'data-item');
                                var choiceTarget = (0, _utils.findAncestorByAttrName)(target, 'data-choice');

                                if (buttonTarget) {
                                    this._handleButtonAction(activeItems, buttonTarget);
                                } else if (itemTarget) {
                                    this._handleItemAction(activeItems, itemTarget, hasShiftKey);
                                } else if (choiceTarget) {
                                    this._handleChoiceAction(activeItems, choiceTarget);
                                }

                                e.preventDefault();
                            }
                        }

                        /**
                         * Click event
                         * @param  {Object} e Event
                         * @return
                         * @private
                         */

                    }, {
                        key: '_onClick',
                        value: function _onClick(e) {
                            var target = e.target;
                            var hasActiveDropdown = this.dropdown.classList.contains(this.config.classNames.activeState);
                            var activeItems = this.store.getItemsFilteredByActive();

                            // If target is something that concerns us
                            if (this.containerOuter.contains(target)) {
                                // Handle button delete
                                if (target.hasAttribute('data-button')) {
                                    this._handleButtonAction(activeItems, target);
                                }

                                if (!hasActiveDropdown) {
                                    if (this.isTextElement) {
                                        if (document.activeElement !== this.input) {
                                            this.input.focus();
                                        }
                                    } else if (this.canSearch) {
                                        this.showDropdown(true);
                                    } else {
                                        this.showDropdown();
                                        this.containerOuter.focus();
                                    }
                                } else if (this.isSelectOneElement && target !== this.input && !this.dropdown.contains(target)) {
                                    this.hideDropdown(true);
                                }
                            } else {
                                var hasHighlightedItems = activeItems.some(function (item) {
                                    return item.highlighted;
                                });

                                // De-select any highlighted items
                                if (hasHighlightedItems) {
                                    this.unhighlightAll();
                                }

                                // Remove focus state
                                this.containerOuter.classList.remove(this.config.classNames.focusState);

                                // Close all other dropdowns
                                if (hasActiveDropdown) {
                                    this.hideDropdown();
                                }
                            }
                        }

                        /**
                         * Mouse over (hover) event
                         * @param  {Object} e Event
                         * @return
                         * @private
                         */

                    }, {
                        key: '_onMouseOver',
                        value: function _onMouseOver(e) {
                            // If the dropdown is either the target or one of its children is the target
                            if (e.target === this.dropdown || this.dropdown.contains(e.target)) {
                                if (e.target.hasAttribute('data-choice')) this._highlightChoice(e.target);
                            }
                        }

                        /**
                         * Paste event
                         * @param  {Object} e Event
                         * @return
                         * @private
                         */

                    }, {
                        key: '_onPaste',
                        value: function _onPaste(e) {
                            // Disable pasting into the input if option has been set
                            if (e.target === this.input && !this.config.paste) {
                                e.preventDefault();
                            }
                        }

                        /**
                         * Focus event
                         * @param  {Object} e Event
                         * @return
                         * @private
                         */

                    }, {
                        key: '_onFocus',
                        value: function _onFocus(e) {
                            var _this17 = this;

                            var target = e.target;
                            // If target is something that concerns us
                            if (this.containerOuter.contains(target)) {
                                var hasActiveDropdown = this.dropdown.classList.contains(this.config.classNames.activeState);
                                var focusActions = {
                                    text: function text() {
                                        if (target === _this17.input) {
                                            _this17.containerOuter.classList.add(_this17.config.classNames.focusState);
                                        }
                                    },
                                    'select-one': function selectOne() {
                                        _this17.containerOuter.classList.add(_this17.config.classNames.focusState);
                                        if (target === _this17.input) {
                                            // Show dropdown if it isn't already showing
                                            if (!hasActiveDropdown) {
                                                _this17.showDropdown();
                                            }
                                        }
                                    },
                                    'select-multiple': function selectMultiple() {
                                        if (target === _this17.input) {
                                            // If element is a select box, the focused element is the container and the dropdown
                                            // isn't already open, focus and show dropdown
                                            _this17.containerOuter.classList.add(_this17.config.classNames.focusState);

                                            if (!hasActiveDropdown) {
                                                _this17.showDropdown(true);
                                            }
                                        }
                                    }
                                };

                                focusActions[this.passedElement.type]();
                            }
                        }

                        /**
                         * Blur event
                         * @param  {Object} e Event
                         * @return
                         * @private
                         */

                    }, {
                        key: '_onBlur',
                        value: function _onBlur(e) {
                            var _this18 = this;

                            var target = e.target;
                            // If target is something that concerns us
                            if (this.containerOuter.contains(target) && !this.isScrollingOnIe) {
                                var activeItems = this.store.getItemsFilteredByActive();
                                var hasActiveDropdown = this.dropdown.classList.contains(this.config.classNames.activeState);
                                var hasHighlightedItems = activeItems.some(function (item) {
                                    return item.highlighted;
                                });
                                var blurActions = {
                                    text: function text() {
                                        if (target === _this18.input) {
                                            // Remove the focus state
                                            _this18.containerOuter.classList.remove(_this18.config.classNames.focusState);
                                            // De-select any highlighted items
                                            if (hasHighlightedItems) {
                                                _this18.unhighlightAll();
                                            }
                                            // Hide dropdown if it is showing
                                            if (hasActiveDropdown) {
                                                _this18.hideDropdown();
                                            }
                                        }
                                    },
                                    'select-one': function selectOne() {
                                        _this18.containerOuter.classList.remove(_this18.config.classNames.focusState);
                                        if (target === _this18.containerOuter) {
                                            // Hide dropdown if it is showing
                                            if (hasActiveDropdown && !_this18.canSearch) {
                                                _this18.hideDropdown();
                                            }
                                        }
                                        if (target === _this18.input && hasActiveDropdown) {
                                            // Hide dropdown if it is showing
                                            _this18.hideDropdown();
                                        }
                                    },
                                    'select-multiple': function selectMultiple() {
                                        if (target === _this18.input) {
                                            // Remove the focus state
                                            _this18.containerOuter.classList.remove(_this18.config.classNames.focusState);
                                            // Hide dropdown if it is showing
                                            if (hasActiveDropdown) {
                                                _this18.hideDropdown();
                                            }
                                            // De-select any highlighted items
                                            if (hasHighlightedItems) {
                                                _this18.unhighlightAll();
                                            }
                                        }
                                    }
                                };

                                blurActions[this.passedElement.type]();
                            } else {
                                // On IE11, clicking the scollbar blurs our input and thus
                                // closes the dropdown. To stop this, we refocus our input
                                // if we know we are on IE *and* are scrolling.
                                this.isScrollingOnIe = false;
                                this.input.focus();
                            }
                        }

                        /**
                         * Scroll to an option element
                         * @param  {HTMLElement} choice  Option to scroll to
                         * @param  {Number} direction  Whether option is above or below
                         * @return
                         * @private
                         */

                    }, {
                        key: '_scrollToChoice',
                        value: function _scrollToChoice(choice, direction) {
                            var _this19 = this;

                            if (!choice) {
                                return;
                            }

                            var dropdownHeight = this.choiceList.offsetHeight;
                            var choiceHeight = choice.offsetHeight;
                            // Distance from bottom of element to top of parent
                            var choicePos = choice.offsetTop + choiceHeight;
                            // Scroll position of dropdown
                            var containerScrollPos = this.choiceList.scrollTop + dropdownHeight;
                            // Difference between the choice and scroll position
                            var endPoint = direction > 0 ? this.choiceList.scrollTop + choicePos - containerScrollPos : choice.offsetTop;

                            var animateScroll = function animateScroll() {
                                var strength = 4;
                                var choiceListScrollTop = _this19.choiceList.scrollTop;
                                var continueAnimation = false;
                                var easing = void 0;
                                var distance = void 0;

                                if (direction > 0) {
                                    easing = (endPoint - choiceListScrollTop) / strength;
                                    distance = easing > 1 ? easing : 1;

                                    _this19.choiceList.scrollTop = choiceListScrollTop + distance;
                                    if (choiceListScrollTop < endPoint) {
                                        continueAnimation = true;
                                    }
                                } else {
                                    easing = (choiceListScrollTop - endPoint) / strength;
                                    distance = easing > 1 ? easing : 1;

                                    _this19.choiceList.scrollTop = choiceListScrollTop - distance;
                                    if (choiceListScrollTop > endPoint) {
                                        continueAnimation = true;
                                    }
                                }

                                if (continueAnimation) {
                                    requestAnimationFrame(function (time) {
                                        animateScroll(time, endPoint, direction);
                                    });
                                }
                            };

                            requestAnimationFrame(function (time) {
                                animateScroll(time, endPoint, direction);
                            });
                        }

                        /**
                         * Highlight choice
                         * @param  {HTMLElement} [el] Element to highlight
                         * @return
                         * @private
                         */

                    }, {
                        key: '_highlightChoice',
                        value: function _highlightChoice() {
                            var _this20 = this;

                            var el = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

                            // Highlight first element in dropdown
                            var choices = Array.from(this.dropdown.querySelectorAll('[data-choice-selectable]'));
                            var passedEl = el;

                            if (choices && choices.length) {
                                var highlightedChoices = Array.from(this.dropdown.querySelectorAll('.' + this.config.classNames.highlightedState));

                                // Remove any highlighted choices
                                highlightedChoices.forEach(function (choice) {
                                    choice.classList.remove(_this20.config.classNames.highlightedState);
                                    choice.setAttribute('aria-selected', 'false');
                                });

                                if (passedEl) {
                                    this.highlightPosition = choices.indexOf(passedEl);
                                } else {
                                    // Highlight choice based on last known highlight location
                                    if (choices.length > this.highlightPosition) {
                                        // If we have an option to highlight
                                        passedEl = choices[this.highlightPosition];
                                    } else {
                                        // Otherwise highlight the option before
                                        passedEl = choices[choices.length - 1];
                                    }

                                    if (!passedEl) {
                                        passedEl = choices[0];
                                    }
                                }

                                // Highlight given option, and set accessiblity attributes
                                passedEl.classList.add(this.config.classNames.highlightedState);
                                passedEl.setAttribute('aria-selected', 'true');

                                var hasActiveDropdown = this.dropdown.classList.contains(this.config.classNames.activeState);
                                if (hasActiveDropdown) {
                                    // IE11 ignores aria-label and blocks virtual keyboard
                                    // if aria-activedescendant is set without a dropdown
                                    this.input.setAttribute('aria-activedescendant', passedEl.id);
                                    this.containerOuter.setAttribute('aria-activedescendant', passedEl.id);
                                }
                            }
                        }

                        /**
                         * Add item to store with correct value
                         * @param {String} value Value to add to store
                         * @param {String} [label] Label to add to store
                         * @param {Number} [choiceId=-1] ID of the associated choice that was selected
                         * @param {Number} [groupId=-1] ID of group choice is within. Negative number indicates no group
                         * @param {Object} [customProperties] Object containing user defined properties
                         * @return {Object} Class instance
                         * @public
                         */

                    }, {
                        key: '_addItem',
                        value: function _addItem(value) {
                            var label = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
                            var choiceId = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : -1;
                            var groupId = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : -1;
                            var customProperties = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : null;
                            var placeholder = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : false;
                            var keyCode = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : null;

                            var passedValue = (0, _utils.isType)('String', value) ? value.trim() : value;
                            var passedKeyCode = keyCode;
                            var items = this.store.getItems();
                            var passedLabel = label || passedValue;
                            var passedOptionId = parseInt(choiceId, 10) || -1;

                            // Get group if group ID passed
                            var group = groupId >= 0 ? this.store.getGroupById(groupId) : null;

                            // Generate unique id
                            var id = items ? items.length + 1 : 1;

                            // If a prepended value has been passed, prepend it
                            if (this.config.prependValue) {
                                passedValue = this.config.prependValue + passedValue.toString();
                            }

                            // If an appended value has been passed, append it
                            if (this.config.appendValue) {
                                passedValue += this.config.appendValue.toString();
                            }

                            this.store.dispatch((0, _index3.addItem)(passedValue, passedLabel, id, passedOptionId, groupId, customProperties, placeholder, passedKeyCode));

                            if (this.isSelectOneElement) {
                                this.removeActiveItems(id);
                            }

                            // Trigger change event
                            if (group && group.value) {
                                (0, _utils.triggerEvent)(this.passedElement, 'addItem', {
                                    id: id,
                                    value: passedValue,
                                    label: passedLabel,
                                    groupValue: group.value,
                                    keyCode: passedKeyCode
                                });
                            } else {
                                (0, _utils.triggerEvent)(this.passedElement, 'addItem', {
                                    id: id,
                                    value: passedValue,
                                    label: passedLabel,
                                    keyCode: passedKeyCode
                                });
                            }

                            return this;
                        }

                        /**
                         * Remove item from store
                         * @param {Object} item Item to remove
                         * @return {Object} Class instance
                         * @public
                         */

                    }, {
                        key: '_removeItem',
                        value: function _removeItem(item) {
                            if (!item || !(0, _utils.isType)('Object', item)) {
                                return this;
                            }

                            var id = item.id;
                            var value = item.value;
                            var label = item.label;
                            var choiceId = item.choiceId;
                            var groupId = item.groupId;
                            var group = groupId >= 0 ? this.store.getGroupById(groupId) : null;

                            this.store.dispatch((0, _index3.removeItem)(id, choiceId));

                            if (group && group.value) {
                                (0, _utils.triggerEvent)(this.passedElement, 'removeItem', {
                                    id: id,
                                    value: value,
                                    label: label,
                                    groupValue: group.value
                                });
                            } else {
                                (0, _utils.triggerEvent)(this.passedElement, 'removeItem', {
                                    id: id,
                                    value: value,
                                    label: label
                                });
                            }

                            return this;
                        }

                        /**
                         * Add choice to dropdown
                         * @param {String} value Value of choice
                         * @param {String} [label] Label of choice
                         * @param {Boolean} [isSelected=false] Whether choice is selected
                         * @param {Boolean} [isDisabled=false] Whether choice is disabled
                         * @param {Number} [groupId=-1] ID of group choice is within. Negative number indicates no group
                         * @param {Object} [customProperties] Object containing user defined properties
                         * @return
                         * @private
                         */

                    }, {
                        key: '_addChoice',
                        value: function _addChoice(value) {
                            var label = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
                            var isSelected = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
                            var isDisabled = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
                            var groupId = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : -1;
                            var customProperties = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : null;
                            var placeholder = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : false;
                            var keyCode = arguments.length > 7 && arguments[7] !== undefined ? arguments[7] : null;

                            if (typeof value === 'undefined' || value === null) {
                                return;
                            }

                            // Generate unique id
                            var choices = this.store.getChoices();
                            var choiceLabel = label || value;
                            var choiceId = choices ? choices.length + 1 : 1;
                            var choiceElementId = this.baseId + '-' + this.idNames.itemChoice + '-' + choiceId;

                            this.store.dispatch((0, _index3.addChoice)(value, choiceLabel, choiceId, groupId, isDisabled, choiceElementId, customProperties, placeholder, keyCode));

                            if (isSelected) {
                                this._addItem(value, choiceLabel, choiceId, undefined, customProperties, placeholder, keyCode);
                            }
                        }

                        /**
                         * Clear all choices added to the store.
                         * @return
                         * @private
                         */

                    }, {
                        key: '_clearChoices',
                        value: function _clearChoices() {
                            this.store.dispatch((0, _index3.clearChoices)());
                        }

                        /**
                         * Add group to dropdown
                         * @param {Object} group Group to add
                         * @param {Number} id Group ID
                         * @param {String} [valueKey] name of the value property on the object
                         * @param {String} [labelKey] name of the label property on the object
                         * @return
                         * @private
                         */

                    }, {
                        key: '_addGroup',
                        value: function _addGroup(group, id) {
                            var _this21 = this;

                            var valueKey = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'value';
                            var labelKey = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 'label';

                            var groupChoices = (0, _utils.isType)('Object', group) ? group.choices : Array.from(group.getElementsByTagName('OPTION'));
                            var groupId = id || Math.floor(new Date().valueOf() * Math.random());
                            var isDisabled = group.disabled ? group.disabled : false;

                            if (groupChoices) {
                                this.store.dispatch((0, _index3.addGroup)(group.label, groupId, true, isDisabled));

                                groupChoices.forEach(function (option) {
                                    var isOptDisabled = option.disabled || option.parentNode && option.parentNode.disabled;
                                    _this21._addChoice(option[valueKey], (0, _utils.isType)('Object', option) ? option[labelKey] : option.innerHTML, option.selected, isOptDisabled, groupId, option.customProperties, option.placeholder);
                                });
                            } else {
                                this.store.dispatch((0, _index3.addGroup)(group.label, group.id, false, group.disabled));
                            }
                        }

                        /**
                         * Get template from name
                         * @param  {String}    template Name of template to get
                         * @param  {...}       args     Data to pass to template
                         * @return {HTMLElement}        Template
                         * @private
                         */

                    }, {
                        key: '_getTemplate',
                        value: function _getTemplate(template) {
                            if (!template) {
                                return null;
                            }
                            var templates = this.config.templates;

                            for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
                                args[_key - 1] = arguments[_key];
                            }

                            return templates[template].apply(templates, args);
                        }

                        /**
                         * Create HTML element based on type and arguments
                         * @return
                         * @private
                         */

                    }, {
                        key: '_createTemplates',
                        value: function _createTemplates() {
                            var _this22 = this;

                            var globalClasses = this.config.classNames;
                            var templates = {
                                containerOuter: function containerOuter(direction) {
                                    var tabIndex = _this22.isSelectOneElement ? 'tabindex="0"' : '';
                                    var role = _this22.isSelectElement ? 'role="listbox"' : '';
                                    var ariaAutoComplete = '';
                                    var additionalClasses = '';
                                    if (_this22.isSelectElement && _this22.config.searchEnabled) {
                                        role = 'role="combobox"';
                                        ariaAutoComplete = 'aria-autocomplete="list"';
                                    }

                                    [].slice.call(_this22.passedElement.classList).forEach(function (className) {
                                        if (className === globalClasses.containerOuter) {
                                            return;
                                        }
                                        additionalClasses += (additionalClasses ? " " : "") + className;
                                    });

                                    return (0, _utils.strToEl)('\n          <div\n            class="' + globalClasses.containerOuter + ' ' + (additionalClasses ? additionalClasses : "") + '"\n            data-type="' + _this22.passedElement.type + '"\n            ' + role + '\n            ' + tabIndex + '\n            ' + ariaAutoComplete + '\n            aria-haspopup="true"\n            aria-expanded="false"\n            dir="' + direction + '"\n            >\n          </div>\n        ');
                                },
                                containerInner: function containerInner() {
                                    return (0, _utils.strToEl)('\n        <div class="' + globalClasses.containerInner + '"></div>\n      ');
                                },
                                itemList: function itemList() {
                                    var _classNames;

                                    var localClasses = (0, _classnames2.default)(globalClasses.list, (_classNames = {}, _defineProperty(_classNames, globalClasses.listSingle, _this22.isSelectOneElement), _defineProperty(_classNames, globalClasses.listItems, !_this22.isSelectOneElement), _classNames));

                                    return (0, _utils.strToEl)('\n          <div class="' + localClasses + '"></div>\n        ');
                                },
                                placeholder: function placeholder(value) {
                                    return (0, _utils.strToEl)('\n        <div class="' + globalClasses.placeholder + '">\n          ' + value + '\n        </div>\n      ');
                                },
                                item: function item(data) {
                                    var _classNames2;

                                    var ariaSelected = data.active ? 'aria-selected="true"' : '';
                                    var ariaDisabled = data.disabled ? 'aria-disabled="true"' : '';

                                    var localClasses = (0, _classnames2.default)(globalClasses.item, (_classNames2 = {}, _defineProperty(_classNames2, globalClasses.highlightedState, data.highlighted), _defineProperty(_classNames2, globalClasses.itemSelectable, !data.highlighted), _defineProperty(_classNames2, globalClasses.placeholder, data.placeholder), _classNames2));

                                    if (_this22.config.removeItemButton) {
                                        var _classNames3;

                                        localClasses = (0, _classnames2.default)(globalClasses.item, (_classNames3 = {}, _defineProperty(_classNames3, globalClasses.highlightedState, data.highlighted), _defineProperty(_classNames3, globalClasses.itemSelectable, !data.disabled), _defineProperty(_classNames3, globalClasses.placeholder, data.placeholder), _classNames3));

                                        return (0, _utils.strToEl)('\n            <div\n              class="' + localClasses + '"\n              data-item\n              data-id="' + data.id + '"\n              data-value="' + data.value + '"\n              data-deletable\n              ' + ariaSelected + '\n              ' + ariaDisabled + '\n              >\n              ' + data.label + '<!--\n           --><button\n                type="button"\n                class="' + globalClasses.button + '"\n                data-button\n                aria-label="Remove item: \'' + data.value + '\'"\n                >\n                Remove item\n              </button>\n            </div>\n          ');
                                    }

                                    return (0, _utils.strToEl)('\n          <div\n            class="' + localClasses + '"\n            data-item\n            data-id="' + data.id + '"\n            data-value="' + data.value + '"\n            ' + ariaSelected + '\n            ' + ariaDisabled + '\n            >\n            ' + data.label + '\n          </div>\n        ');
                                },
                                choiceList: function choiceList() {
                                    var ariaMultiSelectable = !_this22.isSelectOneElement ? 'aria-multiselectable="true"' : '';

                                    return (0, _utils.strToEl)('\n          <div\n            class="' + globalClasses.list + '"\n            dir="ltr"\n            role="listbox"\n            ' + ariaMultiSelectable + '\n            >\n          </div>\n        ');
                                },
                                choiceGroup: function choiceGroup(data) {
                                    var ariaDisabled = data.disabled ? 'aria-disabled="true"' : '';
                                    var localClasses = (0, _classnames2.default)(globalClasses.group, _defineProperty({}, globalClasses.itemDisabled, data.disabled));

                                    return (0, _utils.strToEl)('\n          <div\n            class="' + localClasses + '"\n            data-group\n            data-id="' + data.id + '"\n            data-value="' + data.value + '"\n            role="group"\n            ' + ariaDisabled + '\n            >\n            <div class="' + globalClasses.groupHeading + '">' + data.value + '</div>\n          </div>\n        ');
                                },
                                choice: function choice(data) {
                                    var _classNames5;

                                    var role = data.groupId > 0 ? 'role="treeitem"' : 'role="option"';
                                    var localClasses = (0, _classnames2.default)(globalClasses.item, globalClasses.itemChoice, (_classNames5 = {}, _defineProperty(_classNames5, globalClasses.itemDisabled, data.disabled), _defineProperty(_classNames5, globalClasses.itemSelectable, !data.disabled), _defineProperty(_classNames5, globalClasses.placeholder, data.placeholder), _classNames5));

                                    return (0, _utils.strToEl)('\n          <div\n            class="' + localClasses + '"\n            data-select-text="' + _this22.config.itemSelectText + '"\n            data-choice\n            data-id="' + data.id + '"\n            data-value="' + data.value + '"\n            ' + (data.disabled ? 'data-choice-disabled aria-disabled="true"' : 'data-choice-selectable') + '\n            id="' + data.elementId + '"\n            ' + role + '\n            >\n            ' + data.label + '\n          </div>\n        ');
                                },
                                input: function input() {
                                    var localClasses = (0, _classnames2.default)(globalClasses.input, globalClasses.inputCloned);

                                    return (0, _utils.strToEl)('\n          <input\n            type="text"\n            class="' + localClasses + '"\n            autocomplete="off"\n            autocapitalize="off"\n            spellcheck="false"\n            role="textbox"\n            aria-autocomplete="list"\n            >\n        ');
                                },
                                dropdown: function dropdown() {
                                    var localClasses = (0, _classnames2.default)(globalClasses.list, globalClasses.listDropdown);

                                    return (0, _utils.strToEl)('\n          <div\n            class="' + localClasses + '"\n            aria-expanded="false"\n            >\n          </div>\n        ');
                                },
                                notice: function notice(label) {
                                    var _classNames6;

                                    var type = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';

                                    var localClasses = (0, _classnames2.default)(globalClasses.item, globalClasses.itemChoice, (_classNames6 = {}, _defineProperty(_classNames6, globalClasses.noResults, type === 'no-results'), _defineProperty(_classNames6, globalClasses.noChoices, type === 'no-choices'), _classNames6));

                                    return (0, _utils.strToEl)('\n          <div class="' + localClasses + '">\n            ' + label + '\n          </div>\n        ');
                                },
                                option: function option(data) {
                                    return (0, _utils.strToEl)('\n        <option value="' + data.value + '" selected>' + data.label + '</option>\n      ');
                                }
                            };

                            // User's custom templates
                            var callbackTemplate = this.config.callbackOnCreateTemplates;
                            var userTemplates = {};
                            if (callbackTemplate && (0, _utils.isType)('Function', callbackTemplate)) {
                                userTemplates = callbackTemplate.call(this, _utils.strToEl);
                            }

                            this.config.templates = (0, _utils.extend)(templates, userTemplates);
                        }

                        /**
                         * Create DOM structure around passed select element
                         * @return
                         * @private
                         */

                    }, {
                        key: '_createInput',
                        value: function _createInput() {
                            var _this23 = this;

                            var direction = this.passedElement.getAttribute('dir') || 'ltr';
                            var containerOuter = this._getTemplate('containerOuter', direction);
                            var containerInner = this._getTemplate('containerInner');
                            var itemList = this._getTemplate('itemList');
                            var choiceList = this._getTemplate('choiceList');
                            var input = this._getTemplate('input');
                            var dropdown = this._getTemplate('dropdown');

                            this.containerOuter = containerOuter;
                            this.containerInner = containerInner;
                            this.input = input;
                            this.choiceList = choiceList;
                            this.itemList = itemList;
                            this.dropdown = dropdown;

                            // Hide passed input
                            this.passedElement.classList.add(this.config.classNames.input, this.config.classNames.hiddenState);

                            // Remove element from tab index
                            this.passedElement.tabIndex = '-1';

                            // Backup original styles if any
                            var origStyle = this.passedElement.getAttribute('style');

                            if (origStyle) {
                                this.passedElement.setAttribute('data-choice-orig-style', origStyle);
                            }

                            this.passedElement.setAttribute('style', 'display:none;');
                            this.passedElement.setAttribute('aria-hidden', 'true');
                            this.passedElement.setAttribute('data-choice', 'active');

                            // Wrap input in container preserving DOM ordering
                            (0, _utils.wrap)(this.passedElement, containerInner);

                            // Wrapper inner container with outer container
                            (0, _utils.wrap)(containerInner, containerOuter);

                            if (this.isSelectOneElement) {
                                input.placeholder = this.config.searchPlaceholderValue || '';
                            } else if (this.placeholder) {
                                input.placeholder = this.placeholder;
                                input.style.width = (0, _utils.getWidthOfInput)(input);
                            }

                            if (!this.config.addItems) {
                                this.disable();
                            }

                            containerOuter.appendChild(containerInner);
                            containerOuter.appendChild(dropdown);
                            containerInner.appendChild(itemList);

                            if (!this.isTextElement) {
                                dropdown.appendChild(choiceList);
                            }

                            if (this.isSelectMultipleElement || this.isTextElement) {
                                containerInner.appendChild(input);
                            } else if (this.canSearch) {
                                dropdown.insertBefore(input, dropdown.firstChild);
                            }

                            if (this.isSelectElement) {
                                var passedGroups = Array.from(this.passedElement.getElementsByTagName('OPTGROUP'));

                                this.highlightPosition = 0;
                                this.isSearching = false;

                                if (passedGroups && passedGroups.length) {
                                    passedGroups.forEach(function (group) {
                                        _this23._addGroup(group, group.id || null);
                                    });
                                } else {
                                    var passedOptions = Array.from(this.passedElement.options);
                                    var filter = this.config.sortFilter;
                                    var allChoices = this.presetChoices;

                                    // Create array of options from option elements
                                    passedOptions.forEach(function (o) {
                                        allChoices.push({
                                            value: o.value,
                                            label: o.innerHTML,
                                            selected: o.selected,
                                            disabled: o.disabled || o.parentNode.disabled,
                                            placeholder: o.hasAttribute('placeholder')
                                        });
                                    });

                                    // If sorting is enabled or the user is searching, filter choices
                                    if (this.config.shouldSort) {
                                        allChoices.sort(filter);
                                    }

                                    // Determine whether there is a selected choice
                                    var hasSelectedChoice = allChoices.some(function (choice) {
                                        return choice.selected;
                                    });

                                    // Add each choice
                                    allChoices.forEach(function (choice, index) {
                                        // Pre-select first choice if it's a single select
                                        if (_this23.isSelectOneElement) {
                                            // If there is a selected choice already or the choice is not
                                            // the first in the array, add each choice normally
                                            // Otherwise pre-select the first choice in the array
                                            var shouldPreselect = !hasSelectedChoice || hasSelectedChoice && index === 0;
                                            var isSelected = shouldPreselect ? true : choice.selected;
                                            var isDisabled = shouldPreselect ? false : choice.disabled;

                                            _this23._addChoice(choice.value, choice.label, isSelected, isDisabled, undefined, choice.customProperties, choice.placeholder);
                                        } else {
                                            _this23._addChoice(choice.value, choice.label, choice.selected, choice.disabled, undefined, choice.customProperties, choice.placeholder);
                                        }
                                    });
                                }
                            } else if (this.isTextElement) {
                                // Add any preset values seperated by delimiter
                                this.presetItems.forEach(function (item) {
                                    var itemType = (0, _utils.getType)(item);
                                    if (itemType === 'Object') {
                                        if (!item.value) {
                                            return;
                                        }
                                        _this23._addItem(item.value, item.label, item.id, undefined, item.customProperties, item.placeholder);
                                    } else if (itemType === 'String') {
                                        _this23._addItem(item);
                                    }
                                });
                            }
                        }

                        /* =====  End of Private functions  ====== */

                    }]);

                    return Choices;
                }();

                module.exports = Choices;

                /***/
}),
/* 2 */
/***/ (function (module, exports, __webpack_require__) {

                /**
                 * @license
                 * Fuse - Lightweight fuzzy-search
                 *
                 * Copyright (c) 2012-2016 Kirollos Risk <kirollos@gmail.com>.
                 * All Rights Reserved. Apache Software License 2.0
                 *
                 * Licensed under the Apache License, Version 2.0 (the "License")
                 * you may not use this file except in compliance with the License.
                 * You may obtain a copy of the License at
                 *
                 * http://www.apache.org/licenses/LICENSE-2.0
                 *
                 * Unless required by applicable law or agreed to in writing, software
                 * distributed under the License is distributed on an "AS IS" BASIS,
                 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
                 * See the License for the specific language governing permissions and
                 * limitations under the License.
                 */
                ; (function (global) {
                    'use strict'

                    /** @type {function(...*)} */
                    function log() {
                        console.log.apply(console, arguments)
                    }

                    var defaultOptions = {
                        // The name of the identifier property. If specified, the returned result will be a list
                        // of the items' dentifiers, otherwise it will be a list of the items.
                        id: null,

                        // Indicates whether comparisons should be case sensitive.

                        caseSensitive: false,

                        // An array of values that should be included from the searcher's output. When this array
                        // contains elements, each result in the list will be of the form `{ item: ..., include1: ..., include2: ... }`.
                        // Values you can include are `score`, `matchedLocations`
                        include: [],

                        // Whether to sort the result list, by score
                        shouldSort: true,

                        // The search function to use
                        // Note that the default search function ([[Function]]) must conform to the following API:
                        //
                        //  @param pattern The pattern string to search
                        //  @param options The search option
                        //  [[Function]].constructor = function(pattern, options)
                        //
                        //  @param text: the string to search in for the pattern
                        //  @return Object in the form of:
                        //    - isMatch: boolean
                        //    - score: Int
                        //  [[Function]].prototype.search = function(text)
                        searchFn: BitapSearcher,

                        // Default sort function
                        sortFn: function (a, b) {
                            return a.score - b.score
                        },

                        // The get function to use when fetching an object's properties.
                        // The default will search nested paths *ie foo.bar.baz*
                        getFn: deepValue,

                        // List of properties that will be searched. This also supports nested properties.
                        keys: [],

                        // Will print to the console. Useful for debugging.
                        verbose: false,

                        // When true, the search algorithm will search individual words **and** the full string,
                        // computing the final score as a function of both. Note that when `tokenize` is `true`,
                        // the `threshold`, `distance`, and `location` are inconsequential for individual tokens.
                        tokenize: false,

                        // When true, the result set will only include records that match all tokens. Will only work
                        // if `tokenize` is also true.
                        matchAllTokens: false,

                        // Regex used to separate words when searching. Only applicable when `tokenize` is `true`.
                        tokenSeparator: / +/g,

                        // Minimum number of characters that must be matched before a result is considered a match
                        minMatchCharLength: 1,

                        // When true, the algorithm continues searching to the end of the input even if a perfect
                        // match is found before the end of the same input.
                        findAllMatches: false
                    }

                    /**
                     * @constructor
                     * @param {!Array} list
                     * @param {!Object<string, *>} options
                     */
                    function Fuse(list, options) {
                        var key

                        this.list = list
                        this.options = options = options || {}

                        for (key in defaultOptions) {
                            if (!defaultOptions.hasOwnProperty(key)) {
                                continue;
                            }
                            // Add boolean type options
                            if (typeof defaultOptions[key] === 'boolean') {
                                this.options[key] = key in options ? options[key] : defaultOptions[key];
                                // Add all other options
                            } else {
                                this.options[key] = options[key] || defaultOptions[key]
                            }
                        }
                    }

                    Fuse.VERSION = '2.7.3'

                    /**
                     * Sets a new list for Fuse to match against.
                     * @param {!Array} list
                     * @return {!Array} The newly set list
                     * @public
                     */
                    Fuse.prototype.set = function (list) {
                        this.list = list
                        return list
                    }

                    Fuse.prototype.search = function (pattern) {
                        if (this.options.verbose) log('\nSearch term:', pattern, '\n')

                        this.pattern = pattern
                        this.results = []
                        this.resultMap = {}
                        this._keyMap = null

                        this._prepareSearchers()
                        this._startSearch()
                        this._computeScore()
                        this._sort()

                        var output = this._format()
                        return output
                    }

                    Fuse.prototype._prepareSearchers = function () {
                        var options = this.options
                        var pattern = this.pattern
                        var searchFn = options.searchFn
                        var tokens = pattern.split(options.tokenSeparator)
                        var i = 0
                        var len = tokens.length

                        if (this.options.tokenize) {
                            this.tokenSearchers = []
                            for (; i < len; i++) {
                                this.tokenSearchers.push(new searchFn(tokens[i], options))
                            }
                        }
                        this.fullSeacher = new searchFn(pattern, options)
                    }

                    Fuse.prototype._startSearch = function () {
                        var options = this.options
                        var getFn = options.getFn
                        var list = this.list
                        var listLen = list.length
                        var keys = this.options.keys
                        var keysLen = keys.length
                        var key
                        var weight
                        var item = null
                        var i
                        var j

                        // Check the first item in the list, if it's a string, then we assume
                        // that every item in the list is also a string, and thus it's a flattened array.
                        if (typeof list[0] === 'string') {
                            // Iterate over every item
                            for (i = 0; i < listLen; i++) {
                                this._analyze('', list[i], i, i)
                            }
                        } else {
                            this._keyMap = {}
                            // Otherwise, the first item is an Object (hopefully), and thus the searching
                            // is done on the values of the keys of each item.
                            // Iterate over every item
                            for (i = 0; i < listLen; i++) {
                                item = list[i]
                                // Iterate over every key
                                for (j = 0; j < keysLen; j++) {
                                    key = keys[j]
                                    if (typeof key !== 'string') {
                                        weight = (1 - key.weight) || 1
                                        this._keyMap[key.name] = {
                                            weight: weight
                                        }
                                        if (key.weight <= 0 || key.weight > 1) {
                                            throw new Error('Key weight has to be > 0 and <= 1')
                                        }
                                        key = key.name
                                    } else {
                                        this._keyMap[key] = {
                                            weight: 1
                                        }
                                    }
                                    this._analyze(key, getFn(item, key, []), item, i)
                                }
                            }
                        }
                    }

                    Fuse.prototype._analyze = function (key, text, entity, index) {
                        var options = this.options
                        var words
                        var scores
                        var exists = false
                        var existingResult
                        var averageScore
                        var finalScore
                        var scoresLen
                        var mainSearchResult
                        var tokenSearcher
                        var termScores
                        var word
                        var tokenSearchResult
                        var hasMatchInText
                        var checkTextMatches
                        var i
                        var j

                        // Check if the text can be searched
                        if (text === undefined || text === null) {
                            return
                        }

                        scores = []

                        var numTextMatches = 0

                        if (typeof text === 'string') {
                            words = text.split(options.tokenSeparator)

                            if (options.verbose) log('---------\nKey:', key)

                            if (this.options.tokenize) {
                                for (i = 0; i < this.tokenSearchers.length; i++) {
                                    tokenSearcher = this.tokenSearchers[i]

                                    if (options.verbose) log('Pattern:', tokenSearcher.pattern)

                                    termScores = []
                                    hasMatchInText = false

                                    for (j = 0; j < words.length; j++) {
                                        word = words[j]
                                        tokenSearchResult = tokenSearcher.search(word)
                                        var obj = {}
                                        if (tokenSearchResult.isMatch) {
                                            obj[word] = tokenSearchResult.score
                                            exists = true
                                            hasMatchInText = true
                                            scores.push(tokenSearchResult.score)
                                        } else {
                                            obj[word] = 1
                                            if (!this.options.matchAllTokens) {
                                                scores.push(1)
                                            }
                                        }
                                        termScores.push(obj)
                                    }

                                    if (hasMatchInText) {
                                        numTextMatches++
                                    }

                                    if (options.verbose) log('Token scores:', termScores)
                                }

                                averageScore = scores[0]
                                scoresLen = scores.length
                                for (i = 1; i < scoresLen; i++) {
                                    averageScore += scores[i]
                                }
                                averageScore = averageScore / scoresLen

                                if (options.verbose) log('Token score average:', averageScore)
                            }

                            mainSearchResult = this.fullSeacher.search(text)
                            if (options.verbose) log('Full text score:', mainSearchResult.score)

                            finalScore = mainSearchResult.score
                            if (averageScore !== undefined) {
                                finalScore = (finalScore + averageScore) / 2
                            }

                            if (options.verbose) log('Score average:', finalScore)

                            checkTextMatches = (this.options.tokenize && this.options.matchAllTokens) ? numTextMatches >= this.tokenSearchers.length : true

                            if (options.verbose) log('Check Matches', checkTextMatches)

                            // If a match is found, add the item to <rawResults>, including its score
                            if ((exists || mainSearchResult.isMatch) && checkTextMatches) {
                                // Check if the item already exists in our results
                                existingResult = this.resultMap[index]

                                if (existingResult) {
                                    // Use the lowest score
                                    // existingResult.score, bitapResult.score
                                    existingResult.output.push({
                                        key: key,
                                        score: finalScore,
                                        matchedIndices: mainSearchResult.matchedIndices
                                    })
                                } else {
                                    // Add it to the raw result list
                                    this.resultMap[index] = {
                                        item: entity,
                                        output: [{
                                            key: key,
                                            score: finalScore,
                                            matchedIndices: mainSearchResult.matchedIndices
                                        }]
                                    }

                                    this.results.push(this.resultMap[index])
                                }
                            }
                        } else if (isArray(text)) {
                            for (i = 0; i < text.length; i++) {
                                this._analyze(key, text[i], entity, index)
                            }
                        }
                    }

                    Fuse.prototype._computeScore = function () {
                        var i
                        var j
                        var keyMap = this._keyMap
                        var totalScore
                        var output
                        var scoreLen
                        var score
                        var weight
                        var results = this.results
                        var bestScore
                        var nScore

                        if (this.options.verbose) log('\n\nComputing score:\n')

                        for (i = 0; i < results.length; i++) {
                            totalScore = 0
                            output = results[i].output
                            scoreLen = output.length

                            bestScore = 1

                            for (j = 0; j < scoreLen; j++) {
                                score = output[j].score
                                weight = keyMap ? keyMap[output[j].key].weight : 1

                                nScore = score * weight

                                if (weight !== 1) {
                                    bestScore = Math.min(bestScore, nScore)
                                } else {
                                    totalScore += nScore
                                    output[j].nScore = nScore
                                }
                            }

                            if (bestScore === 1) {
                                results[i].score = totalScore / scoreLen
                            } else {
                                results[i].score = bestScore
                            }

                            if (this.options.verbose) log(results[i])
                        }
                    }

                    Fuse.prototype._sort = function () {
                        var options = this.options
                        if (options.shouldSort) {
                            if (options.verbose) log('\n\nSorting....')
                            this.results.sort(options.sortFn)
                        }
                    }

                    Fuse.prototype._format = function () {
                        var options = this.options
                        var getFn = options.getFn
                        var finalOutput = []
                        var i
                        var len
                        var results = this.results
                        var replaceValue
                        var getItemAtIndex
                        var include = options.include

                        if (options.verbose) log('\n\nOutput:\n\n', results)

                        // Helper function, here for speed-up, which replaces the item with its value,
                        // if the options specifies it,
                        replaceValue = options.id ? function (index) {
                            results[index].item = getFn(results[index].item, options.id, [])[0]
                        } : function () { }

                        getItemAtIndex = function (index) {
                            var record = results[index]
                            var data
                            var j
                            var output
                            var _item
                            var _result

                            // If `include` has values, put the item in the result
                            if (include.length > 0) {
                                data = {
                                    item: record.item
                                }
                                if (include.indexOf('matches') !== -1) {
                                    output = record.output
                                    data.matches = []
                                    for (j = 0; j < output.length; j++) {
                                        _item = output[j]
                                        _result = {
                                            indices: _item.matchedIndices
                                        }
                                        if (_item.key) {
                                            _result.key = _item.key
                                        }
                                        data.matches.push(_result)
                                    }
                                }

                                if (include.indexOf('score') !== -1) {
                                    data.score = results[index].score
                                }

                            } else {
                                data = record.item
                            }

                            return data
                        }

                        // From the results, push into a new array only the item identifier (if specified)
                        // of the entire item.  This is because we don't want to return the <results>,
                        // since it contains other metadata
                        for (i = 0, len = results.length; i < len; i++) {
                            replaceValue(i)
                            finalOutput.push(getItemAtIndex(i))
                        }

                        return finalOutput
                    }

                    // Helpers

                    function deepValue(obj, path, list) {
                        var firstSegment
                        var remaining
                        var dotIndex
                        var value
                        var i
                        var len

                        if (!path) {
                            // If there's no path left, we've gotten to the object we care about.
                            list.push(obj)
                        } else {
                            dotIndex = path.indexOf('.')

                            if (dotIndex !== -1) {
                                firstSegment = path.slice(0, dotIndex)
                                remaining = path.slice(dotIndex + 1)
                            } else {
                                firstSegment = path
                            }

                            value = obj[firstSegment]
                            if (value !== null && value !== undefined) {
                                if (!remaining && (typeof value === 'string' || typeof value === 'number')) {
                                    list.push(value)
                                } else if (isArray(value)) {
                                    // Search each item in the array.
                                    for (i = 0, len = value.length; i < len; i++) {
                                        deepValue(value[i], remaining, list)
                                    }
                                } else if (remaining) {
                                    // An object. Recurse further.
                                    deepValue(value, remaining, list)
                                }
                            }
                        }

                        return list
                    }

                    function isArray(obj) {
                        return Object.prototype.toString.call(obj) === '[object Array]'
                    }

                    /**
                     * Adapted from "Diff, Match and Patch", by Google
                     *
                     *   http://code.google.com/p/google-diff-match-patch/
                     *
                     * Modified by: Kirollos Risk <kirollos@gmail.com>
                     * -----------------------------------------------
                     * Details: the algorithm and structure was modified to allow the creation of
                     * <Searcher> instances with a <search> method which does the actual
                     * bitap search. The <pattern> (the string that is searched for) is only defined
                     * once per instance and thus it eliminates redundant re-creation when searching
                     * over a list of strings.
                     *
                     * Licensed under the Apache License, Version 2.0 (the "License")
                     * you may not use this file except in compliance with the License.
                     *
                     * @constructor
                     */
                    function BitapSearcher(pattern, options) {
                        options = options || {}
                        this.options = options
                        this.options.location = options.location || BitapSearcher.defaultOptions.location
                        this.options.distance = 'distance' in options ? options.distance : BitapSearcher.defaultOptions.distance
                        this.options.threshold = 'threshold' in options ? options.threshold : BitapSearcher.defaultOptions.threshold
                        this.options.maxPatternLength = options.maxPatternLength || BitapSearcher.defaultOptions.maxPatternLength

                        this.pattern = options.caseSensitive ? pattern : pattern.toLowerCase()
                        this.patternLen = pattern.length

                        if (this.patternLen <= this.options.maxPatternLength) {
                            this.matchmask = 1 << (this.patternLen - 1)
                            this.patternAlphabet = this._calculatePatternAlphabet()
                        }
                    }

                    BitapSearcher.defaultOptions = {
                        // Approximately where in the text is the pattern expected to be found?
                        location: 0,

                        // Determines how close the match must be to the fuzzy location (specified above).
                        // An exact letter match which is 'distance' characters away from the fuzzy location
                        // would score as a complete mismatch. A distance of '0' requires the match be at
                        // the exact location specified, a threshold of '1000' would require a perfect match
                        // to be within 800 characters of the fuzzy location to be found using a 0.8 threshold.
                        distance: 100,

                        // At what point does the match algorithm give up. A threshold of '0.0' requires a perfect match
                        // (of both letters and location), a threshold of '1.0' would match anything.
                        threshold: 0.6,

                        // Machine word size
                        maxPatternLength: 32
                    }

                    /**
                     * Initialize the alphabet for the Bitap algorithm.
                     * @return {Object} Hash of character locations.
                     * @private
                     */
                    BitapSearcher.prototype._calculatePatternAlphabet = function () {
                        var mask = {},
                            i = 0

                        for (i = 0; i < this.patternLen; i++) {
                            mask[this.pattern.charAt(i)] = 0
                        }

                        for (i = 0; i < this.patternLen; i++) {
                            mask[this.pattern.charAt(i)] |= 1 << (this.pattern.length - i - 1)
                        }

                        return mask
                    }

                    /**
                     * Compute and return the score for a match with `e` errors and `x` location.
                     * @param {number} errors Number of errors in match.
                     * @param {number} location Location of match.
                     * @return {number} Overall score for match (0.0 = good, 1.0 = bad).
                     * @private
                     */
                    BitapSearcher.prototype._bitapScore = function (errors, location) {
                        var accuracy = errors / this.patternLen,
                            proximity = Math.abs(this.options.location - location)

                        if (!this.options.distance) {
                            // Dodge divide by zero error.
                            return proximity ? 1.0 : accuracy
                        }
                        return accuracy + (proximity / this.options.distance)
                    }

                    /**
                     * Compute and return the result of the search
                     * @param {string} text The text to search in
                     * @return {{isMatch: boolean, score: number}} Literal containing:
                     *                          isMatch - Whether the text is a match or not
                     *                          score - Overall score for the match
                     * @public
                     */
                    BitapSearcher.prototype.search = function (text) {
                        var options = this.options
                        var i
                        var j
                        var textLen
                        var findAllMatches
                        var location
                        var threshold
                        var bestLoc
                        var binMin
                        var binMid
                        var binMax
                        var start, finish
                        var bitArr
                        var lastBitArr
                        var charMatch
                        var score
                        var locations
                        var matches
                        var isMatched
                        var matchMask
                        var matchedIndices
                        var matchesLen
                        var match

                        text = options.caseSensitive ? text : text.toLowerCase()

                        if (this.pattern === text) {
                            // Exact match
                            return {
                                isMatch: true,
                                score: 0,
                                matchedIndices: [[0, text.length - 1]]
                            }
                        }

                        // When pattern length is greater than the machine word length, just do a a regex comparison
                        if (this.patternLen > options.maxPatternLength) {
                            matches = text.match(new RegExp(this.pattern.replace(options.tokenSeparator, '|')))
                            isMatched = !!matches

                            if (isMatched) {
                                matchedIndices = []
                                for (i = 0, matchesLen = matches.length; i < matchesLen; i++) {
                                    match = matches[i]
                                    matchedIndices.push([text.indexOf(match), match.length - 1])
                                }
                            }

                            return {
                                isMatch: isMatched,
                                // TODO: revisit this score
                                score: isMatched ? 0.5 : 1,
                                matchedIndices: matchedIndices
                            }
                        }

                        findAllMatches = options.findAllMatches

                        location = options.location
                        // Set starting location at beginning text and initialize the alphabet.
                        textLen = text.length
                        // Highest score beyond which we give up.
                        threshold = options.threshold
                        // Is there a nearby exact match? (speedup)
                        bestLoc = text.indexOf(this.pattern, location)

                        // a mask of the matches
                        matchMask = []
                        for (i = 0; i < textLen; i++) {
                            matchMask[i] = 0
                        }

                        if (bestLoc != -1) {
                            threshold = Math.min(this._bitapScore(0, bestLoc), threshold)
                            // What about in the other direction? (speed up)
                            bestLoc = text.lastIndexOf(this.pattern, location + this.patternLen)

                            if (bestLoc != -1) {
                                threshold = Math.min(this._bitapScore(0, bestLoc), threshold)
                            }
                        }

                        bestLoc = -1
                        score = 1
                        locations = []
                        binMax = this.patternLen + textLen

                        for (i = 0; i < this.patternLen; i++) {
                            // Scan for the best match; each iteration allows for one more error.
                            // Run a binary search to determine how far from the match location we can stray
                            // at this error level.
                            binMin = 0
                            binMid = binMax
                            while (binMin < binMid) {
                                if (this._bitapScore(i, location + binMid) <= threshold) {
                                    binMin = binMid
                                } else {
                                    binMax = binMid
                                }
                                binMid = Math.floor((binMax - binMin) / 2 + binMin)
                            }

                            // Use the result from this iteration as the maximum for the next.
                            binMax = binMid
                            start = Math.max(1, location - binMid + 1)
                            if (findAllMatches) {
                                finish = textLen;
                            } else {
                                finish = Math.min(location + binMid, textLen) + this.patternLen
                            }

                            // Initialize the bit array
                            bitArr = Array(finish + 2)

                            bitArr[finish + 1] = (1 << i) - 1

                            for (j = finish; j >= start; j--) {
                                charMatch = this.patternAlphabet[text.charAt(j - 1)]

                                if (charMatch) {
                                    matchMask[j - 1] = 1
                                }

                                bitArr[j] = ((bitArr[j + 1] << 1) | 1) & charMatch

                                if (i !== 0) {
                                    // Subsequent passes: fuzzy match.
                                    bitArr[j] |= (((lastBitArr[j + 1] | lastBitArr[j]) << 1) | 1) | lastBitArr[j + 1]
                                }
                                if (bitArr[j] & this.matchmask) {
                                    score = this._bitapScore(i, j - 1)

                                    // This match will almost certainly be better than any existing match.
                                    // But check anyway.
                                    if (score <= threshold) {
                                        // Indeed it is
                                        threshold = score
                                        bestLoc = j - 1
                                        locations.push(bestLoc)

                                        // Already passed loc, downhill from here on in.
                                        if (bestLoc <= location) {
                                            break
                                        }

                                        // When passing loc, don't exceed our current distance from loc.
                                        start = Math.max(1, 2 * location - bestLoc)
                                    }
                                }
                            }

                            // No hope for a (better) match at greater error levels.
                            if (this._bitapScore(i + 1, location) > threshold) {
                                break
                            }
                            lastBitArr = bitArr
                        }

                        matchedIndices = this._getMatchedIndices(matchMask)

                        // Count exact matches (those with a score of 0) to be "almost" exact
                        return {
                            isMatch: bestLoc >= 0,
                            score: score === 0 ? 0.001 : score,
                            matchedIndices: matchedIndices
                        }
                    }

                    BitapSearcher.prototype._getMatchedIndices = function (matchMask) {
                        var matchedIndices = []
                        var start = -1
                        var end = -1
                        var i = 0
                        var match
                        var len = matchMask.length
                        for (; i < len; i++) {
                            match = matchMask[i]
                            if (match && start === -1) {
                                start = i
                            } else if (!match && start !== -1) {
                                end = i - 1
                                if ((end - start) + 1 >= this.options.minMatchCharLength) {
                                    matchedIndices.push([start, end])
                                }
                                start = -1
                            }
                        }
                        if (matchMask[i - 1]) {
                            if ((i - 1 - start) + 1 >= this.options.minMatchCharLength) {
                                matchedIndices.push([start, i - 1])
                            }
                        }
                        return matchedIndices
                    }

                    // Export to Common JS Loader
                    if (true) {
                        // Node. Does not work with strict CommonJS, but
                        // only CommonJS-like environments that support module.exports,
                        // like Node.
                        module.exports = Fuse
                    } else if (typeof define === 'function' && define.amd) {
                        // AMD. Register as an anonymous module.
                        define(function () {
                            return Fuse
                        })
                    } else {
                        // Browser globals (root is window)
                        global.Fuse = Fuse
                    }

                })(this);


                /***/
}),
/* 3 */
/***/ (function (module, exports, __webpack_require__) {

                var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/*!
	  Copyright (c) 2016 Jed Watson.
	  Licensed under the MIT License (MIT), see
	  http://jedwatson.github.io/classnames
	*/
                /* global define */

                (function () {
                    'use strict';

                    var hasOwn = {}.hasOwnProperty;

                    function classNames() {
                        var classes = [];

                        for (var i = 0; i < arguments.length; i++) {
                            var arg = arguments[i];
                            if (!arg) continue;

                            var argType = typeof arg;

                            if (argType === 'string' || argType === 'number') {
                                classes.push(arg);
                            } else if (Array.isArray(arg)) {
                                classes.push(classNames.apply(null, arg));
                            } else if (argType === 'object') {
                                for (var key in arg) {
                                    if (hasOwn.call(arg, key) && arg[key]) {
                                        classes.push(key);
                                    }
                                }
                            }
                        }

                        return classes.join(' ');
                    }

                    if (typeof module !== 'undefined' && module.exports) {
                        module.exports = classNames;
                    } else if (true) {
                        // register as 'classnames', consistent with npm package name
                        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = function () {
                            return classNames;
                        }.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
                    } else {
                        window.classNames = classNames;
                    }
                }());


                /***/
}),
/* 4 */
/***/ (function (module, exports, __webpack_require__) {

                'use strict';

                Object.defineProperty(exports, "__esModule", {
                    value: true
                });

                var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

                var _redux = __webpack_require__(5);

                var _index = __webpack_require__(26);

                var _index2 = _interopRequireDefault(_index);

                function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

                function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

                function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

                var Store = function () {
                    function Store() {
                        _classCallCheck(this, Store);

                        this.store = (0, _redux.createStore)(_index2.default, window.devToolsExtension ? window.devToolsExtension() : undefined);
                    }

                    /**
                     * Get store object (wrapping Redux method)
                     * @return {Object} State
                     */


                    _createClass(Store, [{
                        key: 'getState',
                        value: function getState() {
                            return this.store.getState();
                        }

                        /**
                         * Dispatch event to store (wrapped Redux method)
                         * @param  {Function} action Action function to trigger
                         * @return
                         */

                    }, {
                        key: 'dispatch',
                        value: function dispatch(action) {
                            this.store.dispatch(action);
                        }

                        /**
                         * Subscribe store to function call (wrapped Redux method)
                         * @param  {Function} onChange Function to trigger when state changes
                         * @return
                         */

                    }, {
                        key: 'subscribe',
                        value: function subscribe(onChange) {
                            this.store.subscribe(onChange);
                        }

                        /**
                         * Get items from store
                         * @return {Array} Item objects
                         */

                    }, {
                        key: 'getItems',
                        value: function getItems() {
                            var state = this.store.getState();
                            return state.items;
                        }

                        /**
                         * Get active items from store
                         * @return {Array} Item objects
                         */

                    }, {
                        key: 'getItemsFilteredByActive',
                        value: function getItemsFilteredByActive() {
                            var items = this.getItems();
                            var values = items.filter(function (item) {
                                return item.active === true;
                            }, []);

                            return values;
                        }

                        /**
                         * Get items from store reduced to just their values
                         * @return {Array} Item objects
                         */

                    }, {
                        key: 'getItemsReducedToValues',
                        value: function getItemsReducedToValues() {
                            var items = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.getItems();

                            var values = items.reduce(function (prev, current) {
                                prev.push(current.value);
                                return prev;
                            }, []);

                            return values;
                        }

                        /**
                         * Get choices from store
                         * @return {Array} Option objects
                         */

                    }, {
                        key: 'getChoices',
                        value: function getChoices() {
                            var state = this.store.getState();
                            return state.choices;
                        }

                        /**
                         * Get active choices from store
                         * @return {Array} Option objects
                         */

                    }, {
                        key: 'getChoicesFilteredByActive',
                        value: function getChoicesFilteredByActive() {
                            var choices = this.getChoices();
                            var values = choices.filter(function (choice) {
                                return choice.active === true;
                            });

                            return values;
                        }

                        /**
                         * Get selectable choices from store
                         * @return {Array} Option objects
                         */

                    }, {
                        key: 'getChoicesFilteredBySelectable',
                        value: function getChoicesFilteredBySelectable() {
                            var choices = this.getChoices();
                            var values = choices.filter(function (choice) {
                                return choice.disabled !== true;
                            });

                            return values;
                        }

                        /**
                         * Get choices that can be searched (excluding placeholders)
                         * @return {Array} Option objects
                         */

                    }, {
                        key: 'getSearchableChoices',
                        value: function getSearchableChoices() {
                            var filtered = this.getChoicesFilteredBySelectable();
                            return filtered.filter(function (choice) {
                                return choice.placeholder !== true;
                            });
                        }

                        /**
                         * Get single choice by it's ID
                         * @return {Object} Found choice
                         */

                    }, {
                        key: 'getChoiceById',
                        value: function getChoiceById(id) {
                            if (id) {
                                var choices = this.getChoicesFilteredByActive();
                                var foundChoice = choices.find(function (choice) {
                                    return choice.id === parseInt(id, 10);
                                });
                                return foundChoice;
                            }
                            return false;
                        }

                        /**
                         * Get groups from store
                         * @return {Array} Group objects
                         */

                    }, {
                        key: 'getGroups',
                        value: function getGroups() {
                            var state = this.store.getState();
                            return state.groups;
                        }

                        /**
                         * Get active groups from store
                         * @return {Array} Group objects
                         */

                    }, {
                        key: 'getGroupsFilteredByActive',
                        value: function getGroupsFilteredByActive() {
                            var groups = this.getGroups();
                            var choices = this.getChoices();

                            var values = groups.filter(function (group) {
                                var isActive = group.active === true && group.disabled === false;
                                var hasActiveOptions = choices.some(function (choice) {
                                    return choice.active === true && choice.disabled === false;
                                });
                                return isActive && hasActiveOptions;
                            }, []);

                            return values;
                        }

                        /**
                         * Get group by group id
                         * @param  {Number} id Group ID
                         * @return {Object}    Group data
                         */

                    }, {
                        key: 'getGroupById',
                        value: function getGroupById(id) {
                            var groups = this.getGroups();
                            var foundGroup = groups.find(function (group) {
                                return group.id === id;
                            });

                            return foundGroup;
                        }

                        /**
                         * Get placeholder choice from store
                         * @return {Object} Found placeholder
                         */

                    }, {
                        key: 'getPlaceholderChoice',
                        value: function getPlaceholderChoice() {
                            var choices = this.getChoices();
                            var placeholderChoice = [].concat(_toConsumableArray(choices)).reverse().find(function (choice) {
                                return choice.placeholder === true;
                            });

                            return placeholderChoice;
                        }
                    }]);

                    return Store;
                }();

                exports.default = Store;


                module.exports = Store;

                /***/
}),
/* 5 */
/***/ (function (module, exports, __webpack_require__) {

                'use strict';

                exports.__esModule = true;
                exports.compose = exports.applyMiddleware = exports.bindActionCreators = exports.combineReducers = exports.createStore = undefined;

                var _createStore = __webpack_require__(6);

                var _createStore2 = _interopRequireDefault(_createStore);

                var _combineReducers = __webpack_require__(21);

                var _combineReducers2 = _interopRequireDefault(_combineReducers);

                var _bindActionCreators = __webpack_require__(23);

                var _bindActionCreators2 = _interopRequireDefault(_bindActionCreators);

                var _applyMiddleware = __webpack_require__(24);

                var _applyMiddleware2 = _interopRequireDefault(_applyMiddleware);

                var _compose = __webpack_require__(25);

                var _compose2 = _interopRequireDefault(_compose);

                var _warning = __webpack_require__(22);

                var _warning2 = _interopRequireDefault(_warning);

                function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

                /*
                * This is a dummy function to check if the function name has been altered by minification.
                * If the function has been minified and NODE_ENV !== 'production', warn the user.
                */
                function isCrushed() { }

                if (false) {
                    (0, _warning2['default'])('You are currently using minified code outside of NODE_ENV === \'production\'. ' + 'This means that you are running a slower development build of Redux. ' + 'You can use loose-envify (https://github.com/zertosh/loose-envify) for browserify ' + 'or DefinePlugin for webpack (http://stackoverflow.com/questions/30030031) ' + 'to ensure you have the correct code for your production build.');
                }

                exports.createStore = _createStore2['default'];
                exports.combineReducers = _combineReducers2['default'];
                exports.bindActionCreators = _bindActionCreators2['default'];
                exports.applyMiddleware = _applyMiddleware2['default'];
                exports.compose = _compose2['default'];

                /***/
}),
/* 6 */
/***/ (function (module, exports, __webpack_require__) {

                'use strict';

                exports.__esModule = true;
                exports.ActionTypes = undefined;
                exports['default'] = createStore;

                var _isPlainObject = __webpack_require__(7);

                var _isPlainObject2 = _interopRequireDefault(_isPlainObject);

                var _symbolObservable = __webpack_require__(17);

                var _symbolObservable2 = _interopRequireDefault(_symbolObservable);

                function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

                /**
                 * These are private action types reserved by Redux.
                 * For any unknown actions, you must return the current state.
                 * If the current state is undefined, you must return the initial state.
                 * Do not reference these action types directly in your code.
                 */
                var ActionTypes = exports.ActionTypes = {
                    INIT: '@@redux/INIT'

                    /**
                     * Creates a Redux store that holds the state tree.
                     * The only way to change the data in the store is to call `dispatch()` on it.
                     *
                     * There should only be a single store in your app. To specify how different
                     * parts of the state tree respond to actions, you may combine several reducers
                     * into a single reducer function by using `combineReducers`.
                     *
                     * @param {Function} reducer A function that returns the next state tree, given
                     * the current state tree and the action to handle.
                     *
                     * @param {any} [preloadedState] The initial state. You may optionally specify it
                     * to hydrate the state from the server in universal apps, or to restore a
                     * previously serialized user session.
                     * If you use `combineReducers` to produce the root reducer function, this must be
                     * an object with the same shape as `combineReducers` keys.
                     *
                     * @param {Function} [enhancer] The store enhancer. You may optionally specify it
                     * to enhance the store with third-party capabilities such as middleware,
                     * time travel, persistence, etc. The only store enhancer that ships with Redux
                     * is `applyMiddleware()`.
                     *
                     * @returns {Store} A Redux store that lets you read the state, dispatch actions
                     * and subscribe to changes.
                     */
                }; function createStore(reducer, preloadedState, enhancer) {
                    var _ref2;

                    if (typeof preloadedState === 'function' && typeof enhancer === 'undefined') {
                        enhancer = preloadedState;
                        preloadedState = undefined;
                    }

                    if (typeof enhancer !== 'undefined') {
                        if (typeof enhancer !== 'function') {
                            throw new Error('Expected the enhancer to be a function.');
                        }

                        return enhancer(createStore)(reducer, preloadedState);
                    }

                    if (typeof reducer !== 'function') {
                        throw new Error('Expected the reducer to be a function.');
                    }

                    var currentReducer = reducer;
                    var currentState = preloadedState;
                    var currentListeners = [];
                    var nextListeners = currentListeners;
                    var isDispatching = false;

                    function ensureCanMutateNextListeners() {
                        if (nextListeners === currentListeners) {
                            nextListeners = currentListeners.slice();
                        }
                    }

                    /**
                     * Reads the state tree managed by the store.
                     *
                     * @returns {any} The current state tree of your application.
                     */
                    function getState() {
                        return currentState;
                    }

                    /**
                     * Adds a change listener. It will be called any time an action is dispatched,
                     * and some part of the state tree may potentially have changed. You may then
                     * call `getState()` to read the current state tree inside the callback.
                     *
                     * You may call `dispatch()` from a change listener, with the following
                     * caveats:
                     *
                     * 1. The subscriptions are snapshotted just before every `dispatch()` call.
                     * If you subscribe or unsubscribe while the listeners are being invoked, this
                     * will not have any effect on the `dispatch()` that is currently in progress.
                     * However, the next `dispatch()` call, whether nested or not, will use a more
                     * recent snapshot of the subscription list.
                     *
                     * 2. The listener should not expect to see all state changes, as the state
                     * might have been updated multiple times during a nested `dispatch()` before
                     * the listener is called. It is, however, guaranteed that all subscribers
                     * registered before the `dispatch()` started will be called with the latest
                     * state by the time it exits.
                     *
                     * @param {Function} listener A callback to be invoked on every dispatch.
                     * @returns {Function} A function to remove this change listener.
                     */
                    function subscribe(listener) {
                        if (typeof listener !== 'function') {
                            throw new Error('Expected listener to be a function.');
                        }

                        var isSubscribed = true;

                        ensureCanMutateNextListeners();
                        nextListeners.push(listener);

                        return function unsubscribe() {
                            if (!isSubscribed) {
                                return;
                            }

                            isSubscribed = false;

                            ensureCanMutateNextListeners();
                            var index = nextListeners.indexOf(listener);
                            nextListeners.splice(index, 1);
                        };
                    }

                    /**
                     * Dispatches an action. It is the only way to trigger a state change.
                     *
                     * The `reducer` function, used to create the store, will be called with the
                     * current state tree and the given `action`. Its return value will
                     * be considered the **next** state of the tree, and the change listeners
                     * will be notified.
                     *
                     * The base implementation only supports plain object actions. If you want to
                     * dispatch a Promise, an Observable, a thunk, or something else, you need to
                     * wrap your store creating function into the corresponding middleware. For
                     * example, see the documentation for the `redux-thunk` package. Even the
                     * middleware will eventually dispatch plain object actions using this method.
                     *
                     * @param {Object} action A plain object representing â€œwhat changedâ€. It is
                     * a good idea to keep actions serializable so you can record and replay user
                     * sessions, or use the time travelling `redux-devtools`. An action must have
                     * a `type` property which may not be `undefined`. It is a good idea to use
                     * string constants for action types.
                     *
                     * @returns {Object} For convenience, the same action object you dispatched.
                     *
                     * Note that, if you use a custom middleware, it may wrap `dispatch()` to
                     * return something else (for example, a Promise you can await).
                     */
                    function dispatch(action) {
                        if (!(0, _isPlainObject2['default'])(action)) {
                            throw new Error('Actions must be plain objects. ' + 'Use custom middleware for async actions.');
                        }

                        if (typeof action.type === 'undefined') {
                            throw new Error('Actions may not have an undefined "type" property. ' + 'Have you misspelled a constant?');
                        }

                        if (isDispatching) {
                            throw new Error('Reducers may not dispatch actions.');
                        }

                        try {
                            isDispatching = true;
                            currentState = currentReducer(currentState, action);
                        } finally {
                            isDispatching = false;
                        }

                        var listeners = currentListeners = nextListeners;
                        for (var i = 0; i < listeners.length; i++) {
                            var listener = listeners[i];
                            listener();
                        }

                        return action;
                    }

                    /**
                     * Replaces the reducer currently used by the store to calculate the state.
                     *
                     * You might need this if your app implements code splitting and you want to
                     * load some of the reducers dynamically. You might also need this if you
                     * implement a hot reloading mechanism for Redux.
                     *
                     * @param {Function} nextReducer The reducer for the store to use instead.
                     * @returns {void}
                     */
                    function replaceReducer(nextReducer) {
                        if (typeof nextReducer !== 'function') {
                            throw new Error('Expected the nextReducer to be a function.');
                        }

                        currentReducer = nextReducer;
                        dispatch({ type: ActionTypes.INIT });
                    }

                    /**
                     * Interoperability point for observable/reactive libraries.
                     * @returns {observable} A minimal observable of state changes.
                     * For more information, see the observable proposal:
                     * https://github.com/tc39/proposal-observable
                     */
                    function observable() {
                        var _ref;

                        var outerSubscribe = subscribe;
                        return _ref = {
                            /**
                             * The minimal observable subscription method.
                             * @param {Object} observer Any object that can be used as an observer.
                             * The observer object should have a `next` method.
                             * @returns {subscription} An object with an `unsubscribe` method that can
                             * be used to unsubscribe the observable from the store, and prevent further
                             * emission of values from the observable.
                             */
                            subscribe: function subscribe(observer) {
                                if (typeof observer !== 'object') {
                                    throw new TypeError('Expected the observer to be an object.');
                                }

                                function observeState() {
                                    if (observer.next) {
                                        observer.next(getState());
                                    }
                                }

                                observeState();
                                var unsubscribe = outerSubscribe(observeState);
                                return { unsubscribe: unsubscribe };
                            }
                        }, _ref[_symbolObservable2['default']] = function () {
                            return this;
                        }, _ref;
                    }

                    // When a store is created, an "INIT" action is dispatched so that every
                    // reducer returns their initial state. This effectively populates
                    // the initial state tree.
                    dispatch({ type: ActionTypes.INIT });

                    return _ref2 = {
                        dispatch: dispatch,
                        subscribe: subscribe,
                        getState: getState,
                        replaceReducer: replaceReducer
                    }, _ref2[_symbolObservable2['default']] = observable, _ref2;
                }

                /***/
}),
/* 7 */
/***/ (function (module, exports, __webpack_require__) {

                var baseGetTag = __webpack_require__(8),
                    getPrototype = __webpack_require__(14),
                    isObjectLike = __webpack_require__(16);

                /** `Object#toString` result references. */
                var objectTag = '[object Object]';

                /** Used for built-in method references. */
                var funcProto = Function.prototype,
                    objectProto = Object.prototype;

                /** Used to resolve the decompiled source of functions. */
                var funcToString = funcProto.toString;

                /** Used to check objects for own properties. */
                var hasOwnProperty = objectProto.hasOwnProperty;

                /** Used to infer the `Object` constructor. */
                var objectCtorString = funcToString.call(Object);

                /**
                 * Checks if `value` is a plain object, that is, an object created by the
                 * `Object` constructor or one with a `[[Prototype]]` of `null`.
                 *
                 * @static
                 * @memberOf _
                 * @since 0.8.0
                 * @category Lang
                 * @param {*} value The value to check.
                 * @returns {boolean} Returns `true` if `value` is a plain object, else `false`.
                 * @example
                 *
                 * function Foo() {
                 *   this.a = 1;
                 * }
                 *
                 * _.isPlainObject(new Foo);
                 * // => false
                 *
                 * _.isPlainObject([1, 2, 3]);
                 * // => false
                 *
                 * _.isPlainObject({ 'x': 0, 'y': 0 });
                 * // => true
                 *
                 * _.isPlainObject(Object.create(null));
                 * // => true
                 */
                function isPlainObject(value) {
                    if (!isObjectLike(value) || baseGetTag(value) != objectTag) {
                        return false;
                    }
                    var proto = getPrototype(value);
                    if (proto === null) {
                        return true;
                    }
                    var Ctor = hasOwnProperty.call(proto, 'constructor') && proto.constructor;
                    return typeof Ctor == 'function' && Ctor instanceof Ctor &&
                        funcToString.call(Ctor) == objectCtorString;
                }

                module.exports = isPlainObject;


                /***/
}),
/* 8 */
/***/ (function (module, exports, __webpack_require__) {

                var Symbol = __webpack_require__(9),
                    getRawTag = __webpack_require__(12),
                    objectToString = __webpack_require__(13);

                /** `Object#toString` result references. */
                var nullTag = '[object Null]',
                    undefinedTag = '[object Undefined]';

                /** Built-in value references. */
                var symToStringTag = Symbol ? Symbol.toStringTag : undefined;

                /**
                 * The base implementation of `getTag` without fallbacks for buggy environments.
                 *
                 * @private
                 * @param {*} value The value to query.
                 * @returns {string} Returns the `toStringTag`.
                 */
                function baseGetTag(value) {
                    if (value == null) {
                        return value === undefined ? undefinedTag : nullTag;
                    }
                    return (symToStringTag && symToStringTag in Object(value))
                        ? getRawTag(value)
                        : objectToString(value);
                }

                module.exports = baseGetTag;


                /***/
}),
/* 9 */
/***/ (function (module, exports, __webpack_require__) {

                var root = __webpack_require__(10);

                /** Built-in value references. */
                var Symbol = root.Symbol;

                module.exports = Symbol;


                /***/
}),
/* 10 */
/***/ (function (module, exports, __webpack_require__) {

                var freeGlobal = __webpack_require__(11);

                /** Detect free variable `self`. */
                var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

                /** Used as a reference to the global object. */
                var root = freeGlobal || freeSelf || Function('return this')();

                module.exports = root;


                /***/
}),
/* 11 */
/***/ (function (module, exports) {

	/* WEBPACK VAR INJECTION */(function (global) {/** Detect free variable `global` from Node.js. */
                    var freeGlobal = typeof global == 'object' && global && global.Object === Object && global;

                    module.exports = freeGlobal;

                    /* WEBPACK VAR INJECTION */
}.call(exports, (function () { return this; }())))

                /***/
}),
/* 12 */
/***/ (function (module, exports, __webpack_require__) {

                var Symbol = __webpack_require__(9);

                /** Used for built-in method references. */
                var objectProto = Object.prototype;

                /** Used to check objects for own properties. */
                var hasOwnProperty = objectProto.hasOwnProperty;

                /**
                 * Used to resolve the
                 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
                 * of values.
                 */
                var nativeObjectToString = objectProto.toString;

                /** Built-in value references. */
                var symToStringTag = Symbol ? Symbol.toStringTag : undefined;

                /**
                 * A specialized version of `baseGetTag` which ignores `Symbol.toStringTag` values.
                 *
                 * @private
                 * @param {*} value The value to query.
                 * @returns {string} Returns the raw `toStringTag`.
                 */
                function getRawTag(value) {
                    var isOwn = hasOwnProperty.call(value, symToStringTag),
                        tag = value[symToStringTag];

                    try {
                        value[symToStringTag] = undefined;
                        var unmasked = true;
                    } catch (e) { }

                    var result = nativeObjectToString.call(value);
                    if (unmasked) {
                        if (isOwn) {
                            value[symToStringTag] = tag;
                        } else {
                            delete value[symToStringTag];
                        }
                    }
                    return result;
                }

                module.exports = getRawTag;


                /***/
}),
/* 13 */
/***/ (function (module, exports) {

                /** Used for built-in method references. */
                var objectProto = Object.prototype;

                /**
                 * Used to resolve the
                 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
                 * of values.
                 */
                var nativeObjectToString = objectProto.toString;

                /**
                 * Converts `value` to a string using `Object.prototype.toString`.
                 *
                 * @private
                 * @param {*} value The value to convert.
                 * @returns {string} Returns the converted string.
                 */
                function objectToString(value) {
                    return nativeObjectToString.call(value);
                }

                module.exports = objectToString;


                /***/
}),
/* 14 */
/***/ (function (module, exports, __webpack_require__) {

                var overArg = __webpack_require__(15);

                /** Built-in value references. */
                var getPrototype = overArg(Object.getPrototypeOf, Object);

                module.exports = getPrototype;


                /***/
}),
/* 15 */
/***/ (function (module, exports) {

                /**
                 * Creates a unary function that invokes `func` with its argument transformed.
                 *
                 * @private
                 * @param {Function} func The function to wrap.
                 * @param {Function} transform The argument transform.
                 * @returns {Function} Returns the new function.
                 */
                function overArg(func, transform) {
                    return function (arg) {
                        return func(transform(arg));
                    };
                }

                module.exports = overArg;


                /***/
}),
/* 16 */
/***/ (function (module, exports) {

                /**
                 * Checks if `value` is object-like. A value is object-like if it's not `null`
                 * and has a `typeof` result of "object".
                 *
                 * @static
                 * @memberOf _
                 * @since 4.0.0
                 * @category Lang
                 * @param {*} value The value to check.
                 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
                 * @example
                 *
                 * _.isObjectLike({});
                 * // => true
                 *
                 * _.isObjectLike([1, 2, 3]);
                 * // => true
                 *
                 * _.isObjectLike(_.noop);
                 * // => false
                 *
                 * _.isObjectLike(null);
                 * // => false
                 */
                function isObjectLike(value) {
                    return value != null && typeof value == 'object';
                }

                module.exports = isObjectLike;


                /***/
}),
/* 17 */
/***/ (function (module, exports, __webpack_require__) {

                module.exports = __webpack_require__(18);


                /***/
}),
/* 18 */
/***/ (function (module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function (global, module) {
                    'use strict';

                    Object.defineProperty(exports, "__esModule", {
                        value: true
                    });

                    var _ponyfill = __webpack_require__(20);

                    var _ponyfill2 = _interopRequireDefault(_ponyfill);

                    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

                    var root; /* global window */


                    if (typeof self !== 'undefined') {
                        root = self;
                    } else if (typeof window !== 'undefined') {
                        root = window;
                    } else if (typeof global !== 'undefined') {
                        root = global;
                    } else if (true) {
                        root = module;
                    } else {
                        root = Function('return this')();
                    }

                    var result = (0, _ponyfill2['default'])(root);
                    exports['default'] = result;
                    /* WEBPACK VAR INJECTION */
}.call(exports, (function () { return this; }()), __webpack_require__(19)(module)))

                /***/
}),
/* 19 */
/***/ (function (module, exports) {

                module.exports = function (module) {
                    if (!module.webpackPolyfill) {
                        module.deprecate = function () { };
                        module.paths = [];
                        // module.parent = undefined by default
                        module.children = [];
                        module.webpackPolyfill = 1;
                    }
                    return module;
                }


                /***/
}),
/* 20 */
/***/ (function (module, exports) {

                'use strict';

                Object.defineProperty(exports, "__esModule", {
                    value: true
                });
                exports['default'] = symbolObservablePonyfill;
                function symbolObservablePonyfill(root) {
                    var result;
                    var _Symbol = root.Symbol;

                    if (typeof _Symbol === 'function') {
                        if (_Symbol.observable) {
                            result = _Symbol.observable;
                        } else {
                            result = _Symbol('observable');
                            _Symbol.observable = result;
                        }
                    } else {
                        result = '@@observable';
                    }

                    return result;
                };

                /***/
}),
/* 21 */
/***/ (function (module, exports, __webpack_require__) {

                'use strict';

                exports.__esModule = true;
                exports['default'] = combineReducers;

                var _createStore = __webpack_require__(6);

                var _isPlainObject = __webpack_require__(7);

                var _isPlainObject2 = _interopRequireDefault(_isPlainObject);

                var _warning = __webpack_require__(22);

                var _warning2 = _interopRequireDefault(_warning);

                function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

                function getUndefinedStateErrorMessage(key, action) {
                    var actionType = action && action.type;
                    var actionName = actionType && '"' + actionType.toString() + '"' || 'an action';

                    return 'Given action ' + actionName + ', reducer "' + key + '" returned undefined. ' + 'To ignore an action, you must explicitly return the previous state. ' + 'If you want this reducer to hold no value, you can return null instead of undefined.';
                }

                function getUnexpectedStateShapeWarningMessage(inputState, reducers, action, unexpectedKeyCache) {
                    var reducerKeys = Object.keys(reducers);
                    var argumentName = action && action.type === _createStore.ActionTypes.INIT ? 'preloadedState argument passed to createStore' : 'previous state received by the reducer';

                    if (reducerKeys.length === 0) {
                        return 'Store does not have a valid reducer. Make sure the argument passed ' + 'to combineReducers is an object whose values are reducers.';
                    }

                    if (!(0, _isPlainObject2['default'])(inputState)) {
                        return 'The ' + argumentName + ' has unexpected type of "' + {}.toString.call(inputState).match(/\s([a-z|A-Z]+)/)[1] + '". Expected argument to be an object with the following ' + ('keys: "' + reducerKeys.join('", "') + '"');
                    }

                    var unexpectedKeys = Object.keys(inputState).filter(function (key) {
                        return !reducers.hasOwnProperty(key) && !unexpectedKeyCache[key];
                    });

                    unexpectedKeys.forEach(function (key) {
                        unexpectedKeyCache[key] = true;
                    });

                    if (unexpectedKeys.length > 0) {
                        return 'Unexpected ' + (unexpectedKeys.length > 1 ? 'keys' : 'key') + ' ' + ('"' + unexpectedKeys.join('", "') + '" found in ' + argumentName + '. ') + 'Expected to find one of the known reducer keys instead: ' + ('"' + reducerKeys.join('", "') + '". Unexpected keys will be ignored.');
                    }
                }

                function assertReducerShape(reducers) {
                    Object.keys(reducers).forEach(function (key) {
                        var reducer = reducers[key];
                        var initialState = reducer(undefined, { type: _createStore.ActionTypes.INIT });

                        if (typeof initialState === 'undefined') {
                            throw new Error('Reducer "' + key + '" returned undefined during initialization. ' + 'If the state passed to the reducer is undefined, you must ' + 'explicitly return the initial state. The initial state may ' + 'not be undefined. If you don\'t want to set a value for this reducer, ' + 'you can use null instead of undefined.');
                        }

                        var type = '@@redux/PROBE_UNKNOWN_ACTION_' + Math.random().toString(36).substring(7).split('').join('.');
                        if (typeof reducer(undefined, { type: type }) === 'undefined') {
                            throw new Error('Reducer "' + key + '" returned undefined when probed with a random type. ' + ('Don\'t try to handle ' + _createStore.ActionTypes.INIT + ' or other actions in "redux/*" ') + 'namespace. They are considered private. Instead, you must return the ' + 'current state for any unknown actions, unless it is undefined, ' + 'in which case you must return the initial state, regardless of the ' + 'action type. The initial state may not be undefined, but can be null.');
                        }
                    });
                }

                /**
                 * Turns an object whose values are different reducer functions, into a single
                 * reducer function. It will call every child reducer, and gather their results
                 * into a single state object, whose keys correspond to the keys of the passed
                 * reducer functions.
                 *
                 * @param {Object} reducers An object whose values correspond to different
                 * reducer functions that need to be combined into one. One handy way to obtain
                 * it is to use ES6 `import * as reducers` syntax. The reducers may never return
                 * undefined for any action. Instead, they should return their initial state
                 * if the state passed to them was undefined, and the current state for any
                 * unrecognized action.
                 *
                 * @returns {Function} A reducer function that invokes every reducer inside the
                 * passed object, and builds a state object with the same shape.
                 */
                function combineReducers(reducers) {
                    var reducerKeys = Object.keys(reducers);
                    var finalReducers = {};
                    for (var i = 0; i < reducerKeys.length; i++) {
                        var key = reducerKeys[i];

                        if (false) {
                            if (typeof reducers[key] === 'undefined') {
                                (0, _warning2['default'])('No reducer provided for key "' + key + '"');
                            }
                        }

                        if (typeof reducers[key] === 'function') {
                            finalReducers[key] = reducers[key];
                        }
                    }
                    var finalReducerKeys = Object.keys(finalReducers);

                    var unexpectedKeyCache = void 0;
                    if (false) {
                        unexpectedKeyCache = {};
                    }

                    var shapeAssertionError = void 0;
                    try {
                        assertReducerShape(finalReducers);
                    } catch (e) {
                        shapeAssertionError = e;
                    }

                    return function combination() {
                        var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
                        var action = arguments[1];

                        if (shapeAssertionError) {
                            throw shapeAssertionError;
                        }

                        if (false) {
                            var warningMessage = getUnexpectedStateShapeWarningMessage(state, finalReducers, action, unexpectedKeyCache);
                            if (warningMessage) {
                                (0, _warning2['default'])(warningMessage);
                            }
                        }

                        var hasChanged = false;
                        var nextState = {};
                        for (var _i = 0; _i < finalReducerKeys.length; _i++) {
                            var _key = finalReducerKeys[_i];
                            var reducer = finalReducers[_key];
                            var previousStateForKey = state[_key];
                            var nextStateForKey = reducer(previousStateForKey, action);
                            if (typeof nextStateForKey === 'undefined') {
                                var errorMessage = getUndefinedStateErrorMessage(_key, action);
                                throw new Error(errorMessage);
                            }
                            nextState[_key] = nextStateForKey;
                            hasChanged = hasChanged || nextStateForKey !== previousStateForKey;
                        }
                        return hasChanged ? nextState : state;
                    };
                }

                /***/
}),
/* 22 */
/***/ (function (module, exports) {

                'use strict';

                exports.__esModule = true;
                exports['default'] = warning;
                /**
                 * Prints a warning in the console if it exists.
                 *
                 * @param {String} message The warning message.
                 * @returns {void}
                 */
                function warning(message) {
                    /* eslint-disable no-console */
                    if (typeof console !== 'undefined' && typeof console.error === 'function') {
                        console.error(message);
                    }
                    /* eslint-enable no-console */
                    try {
                        // This error was thrown as a convenience so that if you enable
                        // "break on all exceptions" in your console,
                        // it would pause the execution at this line.
                        throw new Error(message);
                        /* eslint-disable no-empty */
                    } catch (e) { }
                    /* eslint-enable no-empty */
                }

                /***/
}),
/* 23 */
/***/ (function (module, exports) {

                'use strict';

                exports.__esModule = true;
                exports['default'] = bindActionCreators;
                function bindActionCreator(actionCreator, dispatch) {
                    return function () {
                        return dispatch(actionCreator.apply(undefined, arguments));
                    };
                }

                /**
                 * Turns an object whose values are action creators, into an object with the
                 * same keys, but with every function wrapped into a `dispatch` call so they
                 * may be invoked directly. This is just a convenience method, as you can call
                 * `store.dispatch(MyActionCreators.doSomething())` yourself just fine.
                 *
                 * For convenience, you can also pass a single function as the first argument,
                 * and get a function in return.
                 *
                 * @param {Function|Object} actionCreators An object whose values are action
                 * creator functions. One handy way to obtain it is to use ES6 `import * as`
                 * syntax. You may also pass a single function.
                 *
                 * @param {Function} dispatch The `dispatch` function available on your Redux
                 * store.
                 *
                 * @returns {Function|Object} The object mimicking the original object, but with
                 * every action creator wrapped into the `dispatch` call. If you passed a
                 * function as `actionCreators`, the return value will also be a single
                 * function.
                 */
                function bindActionCreators(actionCreators, dispatch) {
                    if (typeof actionCreators === 'function') {
                        return bindActionCreator(actionCreators, dispatch);
                    }

                    if (typeof actionCreators !== 'object' || actionCreators === null) {
                        throw new Error('bindActionCreators expected an object or a function, instead received ' + (actionCreators === null ? 'null' : typeof actionCreators) + '. ' + 'Did you write "import ActionCreators from" instead of "import * as ActionCreators from"?');
                    }

                    var keys = Object.keys(actionCreators);
                    var boundActionCreators = {};
                    for (var i = 0; i < keys.length; i++) {
                        var key = keys[i];
                        var actionCreator = actionCreators[key];
                        if (typeof actionCreator === 'function') {
                            boundActionCreators[key] = bindActionCreator(actionCreator, dispatch);
                        }
                    }
                    return boundActionCreators;
                }

                /***/
}),
/* 24 */
/***/ (function (module, exports, __webpack_require__) {

                'use strict';

                exports.__esModule = true;

                var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

                exports['default'] = applyMiddleware;

                var _compose = __webpack_require__(25);

                var _compose2 = _interopRequireDefault(_compose);

                function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

                /**
                 * Creates a store enhancer that applies middleware to the dispatch method
                 * of the Redux store. This is handy for a variety of tasks, such as expressing
                 * asynchronous actions in a concise manner, or logging every action payload.
                 *
                 * See `redux-thunk` package as an example of the Redux middleware.
                 *
                 * Because middleware is potentially asynchronous, this should be the first
                 * store enhancer in the composition chain.
                 *
                 * Note that each middleware will be given the `dispatch` and `getState` functions
                 * as named arguments.
                 *
                 * @param {...Function} middlewares The middleware chain to be applied.
                 * @returns {Function} A store enhancer applying the middleware.
                 */
                function applyMiddleware() {
                    for (var _len = arguments.length, middlewares = Array(_len), _key = 0; _key < _len; _key++) {
                        middlewares[_key] = arguments[_key];
                    }

                    return function (createStore) {
                        return function (reducer, preloadedState, enhancer) {
                            var store = createStore(reducer, preloadedState, enhancer);
                            var _dispatch = store.dispatch;
                            var chain = [];

                            var middlewareAPI = {
                                getState: store.getState,
                                dispatch: function dispatch(action) {
                                    return _dispatch(action);
                                }
                            };
                            chain = middlewares.map(function (middleware) {
                                return middleware(middlewareAPI);
                            });
                            _dispatch = _compose2['default'].apply(undefined, chain)(store.dispatch);

                            return _extends({}, store, {
                                dispatch: _dispatch
                            });
                        };
                    };
                }

                /***/
}),
/* 25 */
/***/ (function (module, exports) {

                "use strict";

                exports.__esModule = true;
                exports["default"] = compose;
                /**
                 * Composes single-argument functions from right to left. The rightmost
                 * function can take multiple arguments as it provides the signature for
                 * the resulting composite function.
                 *
                 * @param {...Function} funcs The functions to compose.
                 * @returns {Function} A function obtained by composing the argument functions
                 * from right to left. For example, compose(f, g, h) is identical to doing
                 * (...args) => f(g(h(...args))).
                 */

                function compose() {
                    for (var _len = arguments.length, funcs = Array(_len), _key = 0; _key < _len; _key++) {
                        funcs[_key] = arguments[_key];
                    }

                    if (funcs.length === 0) {
                        return function (arg) {
                            return arg;
                        };
                    }

                    if (funcs.length === 1) {
                        return funcs[0];
                    }

                    return funcs.reduce(function (a, b) {
                        return function () {
                            return a(b.apply(undefined, arguments));
                        };
                    });
                }

                /***/
}),
/* 26 */
/***/ (function (module, exports, __webpack_require__) {

                'use strict';

                Object.defineProperty(exports, "__esModule", {
                    value: true
                });

                var _redux = __webpack_require__(5);

                var _items = __webpack_require__(27);

                var _items2 = _interopRequireDefault(_items);

                var _groups = __webpack_require__(28);

                var _groups2 = _interopRequireDefault(_groups);

                var _choices = __webpack_require__(29);

                var _choices2 = _interopRequireDefault(_choices);

                function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

                var appReducer = (0, _redux.combineReducers)({
                    items: _items2.default,
                    groups: _groups2.default,
                    choices: _choices2.default
                });

                var rootReducer = function rootReducer(passedState, action) {
                    var state = passedState;
                    // If we are clearing all items, groups and options we reassign
                    // state and then pass that state to our proper reducer. This isn't
                    // mutating our actual state
                    // See: http://stackoverflow.com/a/35641992
                    if (action.type === 'CLEAR_ALL') {
                        state = undefined;
                    }

                    return appReducer(state, action);
                };

                exports.default = rootReducer;

                /***/
}),
/* 27 */
/***/ (function (module, exports) {

                'use strict';

                Object.defineProperty(exports, "__esModule", {
                    value: true
                });

                function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

                var items = function items() {
                    var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
                    var action = arguments[1];

                    switch (action.type) {
                        case 'ADD_ITEM':
                            {
                                // Add object to items array
                                var newState = [].concat(_toConsumableArray(state), [{
                                    id: action.id,
                                    choiceId: action.choiceId,
                                    groupId: action.groupId,
                                    value: action.value,
                                    label: action.label,
                                    active: true,
                                    highlighted: false,
                                    customProperties: action.customProperties,
                                    placeholder: action.placeholder || false,
                                    keyCode: null
                                }]);

                                return newState.map(function (obj) {
                                    var item = obj;
                                    if (item.highlighted) {
                                        item.highlighted = false;
                                    }
                                    return item;
                                });
                            }

                        case 'REMOVE_ITEM':
                            {
                                // Set item to inactive
                                return state.map(function (obj) {
                                    var item = obj;
                                    if (item.id === action.id) {
                                        item.active = false;
                                    }
                                    return item;
                                });
                            }

                        case 'HIGHLIGHT_ITEM':
                            {
                                return state.map(function (obj) {
                                    var item = obj;
                                    if (item.id === action.id) {
                                        item.highlighted = action.highlighted;
                                    }
                                    return item;
                                });
                            }

                        default:
                            {
                                return state;
                            }
                    }
                };

                exports.default = items;

                /***/
}),
/* 28 */
/***/ (function (module, exports) {

                'use strict';

                Object.defineProperty(exports, "__esModule", {
                    value: true
                });

                function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

                var groups = function groups() {
                    var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
                    var action = arguments[1];

                    switch (action.type) {
                        case 'ADD_GROUP':
                            {
                                return [].concat(_toConsumableArray(state), [{
                                    id: action.id,
                                    value: action.value,
                                    active: action.active,
                                    disabled: action.disabled
                                }]);
                            }

                        case 'CLEAR_CHOICES':
                            {
                                return [];
                            }

                        default:
                            {
                                return state;
                            }
                    }
                };

                exports.default = groups;

                /***/
}),
/* 29 */
/***/ (function (module, exports) {

                'use strict';

                Object.defineProperty(exports, "__esModule", {
                    value: true
                });

                function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

                var choices = function choices() {
                    var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
                    var action = arguments[1];

                    switch (action.type) {
                        case 'ADD_CHOICE':
                            {
                                /*
                                    A disabled choice appears in the choice dropdown but cannot be selected
                                    A selected choice has been added to the passed input's value (added as an item)
                                    An active choice appears within the choice dropdown
                                 */
                                return [].concat(_toConsumableArray(state), [{
                                    id: action.id,
                                    elementId: action.elementId,
                                    groupId: action.groupId,
                                    value: action.value,
                                    label: action.label || action.value,
                                    disabled: action.disabled || false,
                                    selected: false,
                                    active: true,
                                    score: 9999,
                                    customProperties: action.customProperties,
                                    placeholder: action.placeholder || false,
                                    keyCode: null
                                }]);
                            }

                        case 'ADD_ITEM':
                            {
                                var newState = state;

                                // If all choices need to be activated
                                if (action.activateOptions) {
                                    newState = state.map(function (obj) {
                                        var choice = obj;
                                        choice.active = action.active;
                                        return choice;
                                    });
                                }
                                // When an item is added and it has an associated choice,
                                // we want to disable it so it can't be chosen again
                                if (action.choiceId > -1) {
                                    newState = state.map(function (obj) {
                                        var choice = obj;
                                        if (choice.id === parseInt(action.choiceId, 10)) {
                                            choice.selected = true;
                                        }
                                        return choice;
                                    });
                                }

                                return newState;
                            }

                        case 'REMOVE_ITEM':
                            {
                                // When an item is removed and it has an associated choice,
                                // we want to re-enable it so it can be chosen again
                                if (action.choiceId > -1) {
                                    return state.map(function (obj) {
                                        var choice = obj;
                                        if (choice.id === parseInt(action.choiceId, 10)) {
                                            choice.selected = false;
                                        }
                                        return choice;
                                    });
                                }

                                return state;
                            }

                        case 'FILTER_CHOICES':
                            {
                                var filteredResults = action.results;
                                var filteredState = state.map(function (obj) {
                                    var choice = obj;
                                    // Set active state based on whether choice is
                                    // within filtered results
                                    choice.active = filteredResults.some(function (result) {
                                        if (result.item.id === choice.id) {
                                            choice.score = result.score;
                                            return true;
                                        }
                                        return false;
                                    });

                                    return choice;
                                });

                                return filteredState;
                            }

                        case 'ACTIVATE_CHOICES':
                            {
                                return state.map(function (obj) {
                                    var choice = obj;
                                    choice.active = action.active;
                                    return choice;
                                });
                            }

                        case 'CLEAR_CHOICES':
                            {
                                return [];
                            }

                        default:
                            {
                                return state;
                            }
                    }
                };

                exports.default = choices;

                /***/
}),
/* 30 */
/***/ (function (module, exports) {

                'use strict';

                Object.defineProperty(exports, "__esModule", {
                    value: true
                });
                var addItem = exports.addItem = function addItem(value, label, id, choiceId, groupId, customProperties, placeholder, keyCode) {
                    return {
                        type: 'ADD_ITEM',
                        value: value,
                        label: label,
                        id: id,
                        choiceId: choiceId,
                        groupId: groupId,
                        customProperties: customProperties,
                        placeholder: placeholder,
                        keyCode: keyCode
                    };
                };

                var removeItem = exports.removeItem = function removeItem(id, choiceId) {
                    return {
                        type: 'REMOVE_ITEM',
                        id: id,
                        choiceId: choiceId
                    };
                };

                var highlightItem = exports.highlightItem = function highlightItem(id, highlighted) {
                    return {
                        type: 'HIGHLIGHT_ITEM',
                        id: id,
                        highlighted: highlighted
                    };
                };

                var addChoice = exports.addChoice = function addChoice(value, label, id, groupId, disabled, elementId, customProperties, placeholder, keyCode) {
                    return {
                        type: 'ADD_CHOICE',
                        value: value,
                        label: label,
                        id: id,
                        groupId: groupId,
                        disabled: disabled,
                        elementId: elementId,
                        customProperties: customProperties,
                        placeholder: placeholder,
                        keyCode: keyCode
                    };
                };

                var filterChoices = exports.filterChoices = function filterChoices(results) {
                    return {
                        type: 'FILTER_CHOICES',
                        results: results
                    };
                };

                var activateChoices = exports.activateChoices = function activateChoices() {
                    var active = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;
                    return {
                        type: 'ACTIVATE_CHOICES',
                        active: active
                    };
                };

                var clearChoices = exports.clearChoices = function clearChoices() {
                    return {
                        type: 'CLEAR_CHOICES'
                    };
                };

                var addGroup = exports.addGroup = function addGroup(value, id, active, disabled) {
                    return {
                        type: 'ADD_GROUP',
                        value: value,
                        id: id,
                        active: active,
                        disabled: disabled
                    };
                };

                var clearAll = exports.clearAll = function clearAll() {
                    return {
                        type: 'CLEAR_ALL'
                    };
                };

                /***/
}),
/* 31 */
/***/ (function (module, exports) {

                'use strict';

                Object.defineProperty(exports, "__esModule", {
                    value: true
                });

                var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

                /* eslint-disable */

                /**
                 * Capitalises the first letter of each word in a string
                 * @param  {String} str String to capitalise
                 * @return {String}     Capitalised string
                 */
                var capitalise = exports.capitalise = function capitalise(str) {
                    return str.replace(/\w\S*/g, function (txt) {
                        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
                    });
                };

                /**
                 * Generates a string of random chars
                 * @param  {Number} length Length of the string to generate
                 * @return {String} String of random chars
                 */
                var generateChars = exports.generateChars = function generateChars(length) {
                    var chars = '';

                    for (var i = 0; i < length; i++) {
                        var randomChar = getRandomNumber(0, 36);
                        chars += randomChar.toString(36);
                    }

                    return chars;
                };

                /**
                 * Generates a unique id based on an element
                 * @param  {HTMLElement} element Element to generate the id from
                 * @param  {String} Prefix for the Id
                 * @return {String} Unique Id
                 */
                var generateId = exports.generateId = function generateId(element, prefix) {
                    var id = element.id || element.name && element.name + '-' + generateChars(2) || generateChars(4);
                    id = id.replace(/(:|\.|\[|\]|,)/g, '');
                    id = prefix + id;

                    return id;
                };

                /**
                 * Tests the type of an object
                 * @param  {String}  type Type to test object against
                 * @param  {Object}  obj  Object to be tested
                 * @return {Boolean}
                 */
                var getType = exports.getType = function getType(obj) {
                    return Object.prototype.toString.call(obj).slice(8, -1);
                };

                /**
                 * Tests the type of an object
                 * @param  {String}  type Type to test object against
                 * @param  {Object}  obj  Object to be tested
                 * @return {Boolean}
                 */
                var isType = exports.isType = function isType(type, obj) {
                    var clas = getType(obj);
                    return obj !== undefined && obj !== null && clas === type;
                };

                /**
                 * Tests to see if a passed object is a node
                 * @param  {Object}  obj  Object to be tested
                 * @return {Boolean}
                 */
                var isNode = exports.isNode = function isNode(o) {
                    return (typeof Node === 'undefined' ? 'undefined' : _typeof(Node)) === 'object' ? o instanceof Node : o && (typeof o === 'undefined' ? 'undefined' : _typeof(o)) === 'object' && typeof o.nodeType === 'number' && typeof o.nodeName === 'string';
                };

                /**
                 * Tests to see if a passed object is an element
                 * @param  {Object}  obj  Object to be tested
                 * @return {Boolean}
                 */
                var isElement = exports.isElement = function isElement(o) {
                    return (typeof HTMLElement === 'undefined' ? 'undefined' : _typeof(HTMLElement)) === 'object' ? o instanceof HTMLElement : // DOM2
                        o && (typeof o === 'undefined' ? 'undefined' : _typeof(o)) === 'object' && o !== null && o.nodeType === 1 && typeof o.nodeName === 'string';
                };

                /**
                 * Merges unspecified amount of objects into new object
                 * @private
                 * @return {Object} Merged object of arguments
                 */
                var extend = exports.extend = function extend() {
                    var extended = {};
                    var length = arguments.length;

                    /**
                     * Merge one object into another
                     * @param  {Object} obj  Object to merge into extended object
                     */
                    var merge = function merge(obj) {
                        for (var prop in obj) {
                            if (Object.prototype.hasOwnProperty.call(obj, prop)) {
                                // If deep merge and property is an object, merge properties
                                if (isType('Object', obj[prop])) {
                                    extended[prop] = extend(true, extended[prop], obj[prop]);
                                } else {
                                    extended[prop] = obj[prop];
                                }
                            }
                        }
                    };

                    // Loop through each passed argument
                    for (var i = 0; i < length; i++) {
                        // store argument at position i
                        var obj = arguments[i];

                        // If we are in fact dealing with an object, merge it.
                        if (isType('Object', obj)) {
                            merge(obj);
                        }
                    }

                    return extended;
                };

                /**
                 * CSS transition end event listener
                 * @return
                 */
                var whichTransitionEvent = exports.whichTransitionEvent = function whichTransitionEvent() {
                    var t = void 0,
                        el = document.createElement('fakeelement');

                    var transitions = {
                        transition: 'transitionend',
                        OTransition: 'oTransitionEnd',
                        MozTransition: 'transitionend',
                        WebkitTransition: 'webkitTransitionEnd'
                    };

                    for (t in transitions) {
                        if (el.style[t] !== undefined) {
                            return transitions[t];
                        }
                    }
                };

                /**
                 * CSS animation end event listener
                 * @return
                 */
                var whichAnimationEvent = exports.whichAnimationEvent = function whichAnimationEvent() {
                    var t = void 0,
                        el = document.createElement('fakeelement');

                    var animations = {
                        animation: 'animationend',
                        OAnimation: 'oAnimationEnd',
                        MozAnimation: 'animationend',
                        WebkitAnimation: 'webkitAnimationEnd'
                    };

                    for (t in animations) {
                        if (el.style[t] !== undefined) {
                            return animations[t];
                        }
                    }
                };

                /**
                 *  Get the ancestors of each element in the current set of matched elements,
                 *  up to but not including the element matched by the selector
                 * @param  {NodeElement} elem     Element to begin search from
                 * @param  {NodeElement} parent   Parent to find
                 * @param  {String} selector Class to find
                 * @return {Array}          Array of parent elements
                 */
                var getParentsUntil = exports.getParentsUntil = function getParentsUntil(elem, parent, selector) {
                    var parents = [];
                    // Get matches
                    for (; elem && elem !== document; elem = elem.parentNode) {
                        // Check if parent has been reached
                        if (parent) {
                            var parentType = parent.charAt(0);

                            // If parent is a class
                            if (parentType === '.') {
                                if (elem.classList.contains(parent.substr(1))) {
                                    break;
                                }
                            }

                            // If parent is an ID
                            if (parentType === '#') {
                                if (elem.id === parent.substr(1)) {
                                    break;
                                }
                            }

                            // If parent is a data attribute
                            if (parentType === '[') {
                                if (elem.hasAttribute(parent.substr(1, parent.length - 1))) {
                                    break;
                                }
                            }

                            // If parent is a tag
                            if (elem.tagName.toLowerCase() === parent) {
                                break;
                            }
                        }
                        if (selector) {
                            var selectorType = selector.charAt(0);

                            // If selector is a class
                            if (selectorType === '.') {
                                if (elem.classList.contains(selector.substr(1))) {
                                    parents.push(elem);
                                }
                            }

                            // If selector is an ID
                            if (selectorType === '#') {
                                if (elem.id === selector.substr(1)) {
                                    parents.push(elem);
                                }
                            }

                            // If selector is a data attribute
                            if (selectorType === '[') {
                                if (elem.hasAttribute(selector.substr(1, selector.length - 1))) {
                                    parents.push(elem);
                                }
                            }

                            // If selector is a tag
                            if (elem.tagName.toLowerCase() === selector) {
                                parents.push(elem);
                            }
                        } else {
                            parents.push(elem);
                        }
                    }

                    // Return parents if any exist
                    if (parents.length === 0) {
                        return null;
                    }
                    return parents;
                };

                var wrap = exports.wrap = function wrap(element, wrapper) {
                    wrapper = wrapper || document.createElement('div');
                    if (element.nextSibling) {
                        element.parentNode.insertBefore(wrapper, element.nextSibling);
                    } else {
                        element.parentNode.appendChild(wrapper);
                    }
                    return wrapper.appendChild(element);
                };

                var getSiblings = exports.getSiblings = function getSiblings(elem) {
                    var siblings = [];
                    var sibling = elem.parentNode.firstChild;
                    for (; sibling; sibling = sibling.nextSibling) {
                        if (sibling.nodeType === 1 && sibling !== elem) {
                            siblings.push(sibling);
                        }
                    }
                    return siblings;
                };

                /**
                 * Find ancestor in DOM tree
                 * @param  {NodeElement} el  Element to start search from
                 * @param  {[type]} cls Class of parent
                 * @return {NodeElement}     Found parent element
                 */
                var findAncestor = exports.findAncestor = function findAncestor(el, cls) {
                    while ((el = el.parentElement) && !el.classList.contains(cls)) { }
                    return el;
                };

                /**
                 * Find ancestor in DOM tree by attribute name
                 * @param  {NodeElement} el  Element to start search from
                 * @param  {string} attr Attribute name of parent
                 * @return {?NodeElement}     Found parent element or null
                 */
                var findAncestorByAttrName = exports.findAncestorByAttrName = function findAncestorByAttrName(el, attr) {
                    var target = el;

                    while (target) {
                        if (target.hasAttribute(attr)) {
                            return target;
                        }

                        target = target.parentElement;
                    }

                    return null;
                };

                /**
                 * Debounce an event handler.
                 * @param  {Function} func      Function to run after wait
                 * @param  {Number} wait      The delay before the function is executed
                 * @param  {Boolean} immediate  If  passed, trigger the function on the leading edge, instead of the trailing.
                 * @return {Function}           A function will be called after it stops being called for a given delay
                 */
                var debounce = exports.debounce = function debounce(func, wait, immediate) {
                    var timeout = void 0;
                    return function () {
                        var context = this,
                            args = arguments;
                        var later = function later() {
                            timeout = null;
                            if (!immediate) func.apply(context, args);
                        };
                        var callNow = immediate && !timeout;
                        clearTimeout(timeout);
                        timeout = setTimeout(later, wait);
                        if (callNow) func.apply(context, args);
                    };
                };

                /**
                 * Get an element's distance from the top of the page
                 * @private
                 * @param  {NodeElement} el Element to test for
                 * @return {Number} Elements Distance from top of page
                 */
                var getElemDistance = exports.getElemDistance = function getElemDistance(el) {
                    var location = 0;
                    if (el.offsetParent) {
                        do {
                            location += el.offsetTop;
                            el = el.offsetParent;
                        } while (el);
                    }
                    return location >= 0 ? location : 0;
                };

                /**
                 * Determine element height multiplied by any offsets
                 * @private
                 * @param  {HTMLElement} el Element to test for
                 * @return {Number}    Height of element
                 */
                var getElementOffset = exports.getElementOffset = function getElementOffset(el, offset) {
                    var elOffset = offset;
                    if (elOffset > 1) elOffset = 1;
                    if (elOffset > 0) elOffset = 0;

                    return Math.max(el.offsetHeight * elOffset);
                };

                /**
                 * Get the next or previous element from a given start point
                 * @param  {HTMLElement} startEl    Element to start position from
                 * @param  {String}      className  The class we will look through
                 * @param  {Number}      direction  Positive next element, negative previous element
                 * @return {[HTMLElement}           Found element
                 */
                var getAdjacentEl = exports.getAdjacentEl = function getAdjacentEl(startEl, className) {
                    var direction = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 1;

                    if (!startEl || !className) return;

                    var parent = startEl.parentNode.parentNode;
                    var children = Array.from(parent.querySelectorAll(className));

                    var startPos = children.indexOf(startEl);
                    var operatorDirection = direction > 0 ? 1 : -1;

                    return children[startPos + operatorDirection];
                };

                /**
                 * Get scroll position based on top/bottom position
                 * @private
                 * @return {String} Position of scroll
                 */
                var getScrollPosition = exports.getScrollPosition = function getScrollPosition(position) {
                    if (position === 'bottom') {
                        // Scroll position from the bottom of the viewport
                        return Math.max((window.scrollY || window.pageYOffset) + (window.innerHeight || document.documentElement.clientHeight));
                    }
                    // Scroll position from the top of the viewport
                    return window.scrollY || window.pageYOffset;
                };

                /**
                 * Determine whether an element is within the viewport
                 * @param  {HTMLElement}  el Element to test
                 * @return {String} Position of scroll
                 * @return {Boolean}
                 */
                var isInView = exports.isInView = function isInView(el, position, offset) {
                    // If the user has scrolled further than the distance from the element to the top of its parent
                    return this.getScrollPosition(position) > this.getElemDistance(el) + this.getElementOffset(el, offset);
                };

                /**
                 * Determine whether an element is within
                 * @param  {HTMLElement} el        Element to test
                 * @param  {HTMLElement} parent    Scrolling parent
                 * @param  {Number} direction      Whether element is visible from above or below
                 * @return {Boolean}
                 */
                var isScrolledIntoView = exports.isScrolledIntoView = function isScrolledIntoView(el, parent) {
                    var direction = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 1;

                    if (!el) return;

                    var isVisible = void 0;

                    if (direction > 0) {
                        // In view from bottom
                        isVisible = parent.scrollTop + parent.offsetHeight >= el.offsetTop + el.offsetHeight;
                    } else {
                        // In view from top
                        isVisible = el.offsetTop >= parent.scrollTop;
                    }

                    return isVisible;
                };

                /**
                 * Remove html tags from a string
                 * @param  {String}  Initial string/html
                 * @return {String}  Sanitised string
                 */
                var stripHTML = exports.stripHTML = function stripHTML(html) {
                    var el = document.createElement('DIV');
                    el.innerHTML = html;
                    return el.textContent || el.innerText || '';
                };

                /**
                 * Adds animation to an element and removes it upon animation completion
                 * @param  {Element} el        Element to add animation to
                 * @param  {String} animation Animation class to add to element
                 * @return
                 */
                var addAnimation = exports.addAnimation = function addAnimation(el, animation) {
                    var animationEvent = whichAnimationEvent();

                    var removeAnimation = function removeAnimation() {
                        el.classList.remove(animation);
                        el.removeEventListener(animationEvent, removeAnimation, false);
                    };

                    el.classList.add(animation);
                    el.addEventListener(animationEvent, removeAnimation, false);
                };

                /**
                 * Get a random number between a range
                 * @param  {Number} min Minimum range
                 * @param  {Number} max Maximum range
                 * @return {Number}     Random number
                 */
                var getRandomNumber = exports.getRandomNumber = function getRandomNumber(min, max) {
                    return Math.floor(Math.random() * (max - min) + min);
                };

                /**
                 * Turn a string into a node
                 * @param  {String} String to convert
                 * @return {HTMLElement}   Converted node element
                 */
                var strToEl = exports.strToEl = function () {
                    var tmpEl = document.createElement('div');
                    return function (str) {
                        var cleanedInput = str.trim();
                        var r = void 0;
                        tmpEl.innerHTML = cleanedInput;
                        r = tmpEl.children[0];

                        while (tmpEl.firstChild) {
                            tmpEl.removeChild(tmpEl.firstChild);
                        }

                        return r;
                    };
                }();

                /**
                 * Sets the width of a passed input based on its value
                 * @return {Number} Width of input
                 */
                var getWidthOfInput = exports.getWidthOfInput = function getWidthOfInput(input) {
                    var value = input.value || input.placeholder;
                    var width = input.offsetWidth;

                    if (value) {
                        var testEl = strToEl('<span>' + value + '</span>');
                        testEl.style.position = 'absolute';
                        testEl.style.padding = '0';
                        testEl.style.top = '-9999px';
                        testEl.style.left = '-9999px';
                        testEl.style.width = 'auto';
                        testEl.style.whiteSpace = 'pre';

                        if (document.body.contains(input) && window.getComputedStyle) {
                            var inputStyle = window.getComputedStyle(input);

                            if (inputStyle) {
                                testEl.style.fontSize = inputStyle.fontSize;
                                testEl.style.fontFamily = inputStyle.fontFamily;
                                testEl.style.fontWeight = inputStyle.fontWeight;
                                testEl.style.fontStyle = inputStyle.fontStyle;
                                testEl.style.letterSpacing = inputStyle.letterSpacing;
                                testEl.style.textTransform = inputStyle.textTransform;
                                testEl.style.padding = inputStyle.padding;
                            }
                        }

                        document.body.appendChild(testEl);

                        if (value && testEl.offsetWidth !== input.offsetWidth) {
                            width = testEl.offsetWidth + 4;
                        }

                        document.body.removeChild(testEl);
                    }

                    return width + 'px';
                };

                /**
                 * Sorting function for current and previous string
                 * @param  {String} a Current value
                 * @param  {String} b Next value
                 * @return {Number}   -1 for after previous,
                 *                    1 for before,
                 *                    0 for same location
                 */
                var sortByAlpha = exports.sortByAlpha = function sortByAlpha(a, b) {
                    var labelA = (a.label || a.value).toLowerCase();
                    var labelB = (b.label || b.value).toLowerCase();

                    if (labelA < labelB) return -1;
                    if (labelA > labelB) return 1;
                    return 0;
                };

                /**
                 * Sort by numeric score
                 * @param  {Object} a Current value
                 * @param  {Object} b Next value
                 * @return {Number}   -1 for after previous,
                 *                    1 for before,
                 *                    0 for same location
                 */
                var sortByScore = exports.sortByScore = function sortByScore(a, b) {
                    return a.score - b.score;
                };

                /**
                 * Trigger native event
                 * @param  {NodeElement} element Element to trigger event on
                 * @param  {String} type         Type of event to trigger
                 * @param  {Object} customArgs   Data to pass with event
                 * @return {Object}              Triggered event
                 */
                var triggerEvent = exports.triggerEvent = function triggerEvent(element, type) {
                    var customArgs = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;

                    var event = new CustomEvent(type, {
                        detail: customArgs,
                        bubbles: true,
                        cancelable: true
                    });

                    return element.dispatchEvent(event);
                };

                /**
                 * Tests value against a regular expression
                 * @param  {string} value   Value to test
                 * @return {Boolean}        Whether test passed/failed
                 * @private
                 */
                var regexFilter = exports.regexFilter = function regexFilter(value, regex) {
                    if (!value || !regex) {
                        return false;
                    }

                    var expression = new RegExp(regex.source, 'i');
                    return expression.test(value);
                };

                /***/
}),
/* 32 */
/***/ (function (module, exports) {

                'use strict';

                /* eslint-disable */
                (function () {
                    // Production steps of ECMA-262, Edition 6, 22.1.2.1
                    // Reference: https://people.mozilla.org/~jorendorff/es6-draft.html#sec-array.from
                    if (!Array.from) {
                        Array.from = function () {
                            var toStr = Object.prototype.toString;

                            var isCallable = function isCallable(fn) {
                                return typeof fn === 'function' || toStr.call(fn) === '[object Function]';
                            };

                            var toInteger = function toInteger(value) {
                                var number = Number(value);
                                if (isNaN(number)) {
                                    return 0;
                                }
                                if (number === 0 || !isFinite(number)) {
                                    return number;
                                }
                                return (number > 0 ? 1 : -1) * Math.floor(Math.abs(number));
                            };

                            var maxSafeInteger = Math.pow(2, 53) - 1;

                            var toLength = function toLength(value) {
                                var len = toInteger(value);
                                return Math.min(Math.max(len, 0), maxSafeInteger);
                            };

                            // The length property of the from method is 1.
                            return function from(arrayLike /* , mapFn, thisArg */) {
                                // 1. Let C be the this value.
                                var C = this;

                                // 2. Let items be ToObject(arrayLike).
                                var items = Object(arrayLike);

                                // 3. ReturnIfAbrupt(items).
                                if (arrayLike == null) {
                                    throw new TypeError('Array.from requires an array-like object - not null or undefined');
                                }

                                // 4. If mapfn is undefined, then let mapping be false.
                                var mapFn = arguments.length > 1 ? arguments[1] : void undefined;
                                var T = void 0;
                                if (typeof mapFn !== 'undefined') {
                                    // 5. else
                                    // 5. a If IsCallable(mapfn) is false, throw a TypeError exception.
                                    if (!isCallable(mapFn)) {
                                        throw new TypeError('Array.from: when provided, the second argument must be a function');
                                    }

                                    // 5. b. If thisArg was supplied, let T be thisArg; else let T be undefined.
                                    if (arguments.length > 2) {
                                        T = arguments[2];
                                    }
                                }

                                // 10. Let lenValue be Get(items, "length").
                                // 11. Let len be ToLength(lenValue).
                                var len = toLength(items.length);

                                // 13. If IsConstructor(C) is true, then
                                // 13. a. Let A be the result of calling the [[Construct]] internal method of C with an argument list containing the single item len.
                                // 14. a. Else, Let A be ArrayCreate(len).
                                var A = isCallable(C) ? Object(new C(len)) : new Array(len);

                                // 16. Let k be 0.
                                var k = 0;
                                // 17. Repeat, while k < lenâ€¦ (also steps a - h)
                                var kValue = void 0;
                                while (k < len) {
                                    kValue = items[k];
                                    if (mapFn) {
                                        A[k] = typeof T === 'undefined' ? mapFn(kValue, k) : mapFn.call(T, kValue, k);
                                    } else {
                                        A[k] = kValue;
                                    }
                                    k += 1;
                                }
                                // 18. Let putStatus be Put(A, "length", len, true).
                                A.length = len;
                                // 20. Return A.
                                return A;
                            };
                        }();
                    }

                    // Reference: https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Array/find
                    if (!Array.prototype.find) {
                        Array.prototype.find = function (predicate) {
                            'use strict';

                            if (this == null) {
                                throw new TypeError('Array.prototype.find called on null or undefined');
                            }
                            if (typeof predicate !== 'function') {
                                throw new TypeError('predicate must be a function');
                            }
                            var list = Object(this);
                            var length = list.length >>> 0;
                            var thisArg = arguments[1];
                            var value = void 0;

                            for (var i = 0; i < length; i++) {
                                value = list[i];
                                if (predicate.call(thisArg, value, i, list)) {
                                    return value;
                                }
                            }
                            return undefined;
                        };
                    }

                    function CustomEvent(event, params) {
                        params = params || {
                            bubbles: false,
                            cancelable: false,
                            detail: undefined
                        };
                        var evt = document.createEvent('CustomEvent');
                        evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
                        return evt;
                    }

                    CustomEvent.prototype = window.Event.prototype;

                    window.CustomEvent = CustomEvent;
                })();

                /***/
})
/******/])
});
;
//# sourceMappingURL=choices.js.map
/*!
 * Pikaday
 *
 * Copyright Â© 2014 David Bushell | BSD & MIT license | https://github.com/dbushell/Pikaday
 */

(function (root, factory) {
    'use strict';

    var moment;
    if (typeof exports === 'object') {
        // CommonJS module
        // Load moment.js as an optional dependency
        try { moment = require('moment'); } catch (e) { }
        module.exports = factory(moment);
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(function (req) {
            // Load moment.js as an optional dependency
            var id = 'moment';
            try { moment = req(id); } catch (e) { }
            return factory(moment);
        });
    } else {
        root.Pikaday = factory(root.moment);
    }
}(this, function (moment) {
    'use strict';

    /**
     * feature detection and helper functions
     */
    var hasMoment = typeof moment === 'function',

        hasEventListeners = !!window.addEventListener,

        document = window.document,

        sto = window.setTimeout,

        addEvent = function (el, e, callback, capture) {
            if (hasEventListeners) {
                el.addEventListener(e, callback, !!capture);
            } else {
                el.attachEvent('on' + e, callback);
            }
        },

        removeEvent = function (el, e, callback, capture) {
            if (hasEventListeners) {
                el.removeEventListener(e, callback, !!capture);
            } else {
                el.detachEvent('on' + e, callback);
            }
        },

        trim = function (str) {
            return str.trim ? str.trim() : str.replace(/^\s+|\s+$/g, '');
        },

        hasClass = function (el, cn) {
            return (' ' + el.className + ' ').indexOf(' ' + cn + ' ') !== -1;
        },

        addClass = function (el, cn) {
            if (!hasClass(el, cn)) {
                el.className = (el.className === '') ? cn : el.className + ' ' + cn;
            }
        },

        removeClass = function (el, cn) {
            el.className = trim((' ' + el.className + ' ').replace(' ' + cn + ' ', ' '));
        },

        isArray = function (obj) {
            return (/Array/).test(Object.prototype.toString.call(obj));
        },

        isDate = function (obj) {
            return (/Date/).test(Object.prototype.toString.call(obj)) && !isNaN(obj.getTime());
        },

        isWeekend = function (date) {
            var day = date.getDay();
            return day === 0 || day === 6;
        },

        isLeapYear = function (year) {
            // solution by Matti Virkkunen: http://stackoverflow.com/a/4881951
            return year % 4 === 0 && year % 100 !== 0 || year % 400 === 0;
        },

        getDaysInMonth = function (year, month) {
            return [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
        },

        setToStartOfDay = function (date) {
            if (isDate(date)) date.setHours(0, 0, 0, 0);
        },

        compareDates = function (a, b) {
            // weak date comparison (use setToStartOfDay(date) to ensure correct result)
            return a.getTime() === b.getTime();
        },

        extend = function (to, from, overwrite) {
            var prop, hasProp;
            for (prop in from) {
                hasProp = to[prop] !== undefined;
                if (hasProp && typeof from[prop] === 'object' && from[prop] !== null && from[prop].nodeName === undefined) {
                    if (isDate(from[prop])) {
                        if (overwrite) {
                            to[prop] = new Date(from[prop].getTime());
                        }
                    }
                    else if (isArray(from[prop])) {
                        if (overwrite) {
                            to[prop] = from[prop].slice(0);
                        }
                    } else {
                        to[prop] = extend({}, from[prop], overwrite);
                    }
                } else if (overwrite || !hasProp) {
                    to[prop] = from[prop];
                }
            }
            return to;
        },

        fireEvent = function (el, eventName, data) {
            var ev;

            if (document.createEvent) {
                ev = document.createEvent('HTMLEvents');
                ev.initEvent(eventName, true, false);
                ev = extend(ev, data);
                el.dispatchEvent(ev);
            } else if (document.createEventObject) {
                ev = document.createEventObject();
                ev = extend(ev, data);
                el.fireEvent('on' + eventName, ev);
            }
        },

        adjustCalendar = function (calendar) {
            if (calendar.month < 0) {
                calendar.year -= Math.ceil(Math.abs(calendar.month) / 12);
                calendar.month += 12;
            }
            if (calendar.month > 11) {
                calendar.year += Math.floor(Math.abs(calendar.month) / 12);
                calendar.month -= 12;
            }
            return calendar;
        },

        /**
         * defaults and localisation
         */
        defaults = {

            // bind the picker to a form field
            field: null,

            // automatically show/hide the picker on `field` focus (default `true` if `field` is set)
            bound: undefined,

            // data-attribute on the input field with an aria assistance tekst (only applied when `bound` is set)
            ariaLabel: 'Use the arrow keys to pick a date',

            // position of the datepicker, relative to the field (default to bottom & left)
            // ('bottom' & 'left' keywords are not used, 'top' & 'right' are modifier on the bottom/left position)
            position: 'bottom left',

            // automatically fit in the viewport even if it means repositioning from the position option
            reposition: true,

            // the default output format for `.toString()` and `field` value
            format: 'YYYY-MM-DD',

            // the toString function which gets passed a current date object and format
            // and returns a string
            toString: null,

            // used to create date object from current input string
            parse: null,

            // the initial date to view when first opened
            defaultDate: null,

            // make the `defaultDate` the initial selected value
            setDefaultDate: false,

            // first day of week (0: Sunday, 1: Monday etc)
            firstDay: 0,

            // the default flag for moment's strict date parsing
            formatStrict: false,

            // the minimum/earliest date that can be selected
            minDate: null,
            // the maximum/latest date that can be selected
            maxDate: null,

            // number of years either side, or array of upper/lower range
            yearRange: 10,

            // show week numbers at head of row
            showWeekNumber: false,

            // Week picker mode
            pickWholeWeek: false,

            // used internally (don't config outside)
            minYear: 0,
            maxYear: 9999,
            minMonth: undefined,
            maxMonth: undefined,

            startRange: null,
            endRange: null,

            isRTL: false,

            // Additional text to append to the year in the calendar title
            yearSuffix: '',

            // Render the month after year in the calendar title
            showMonthAfterYear: false,

            // Render days of the calendar grid that fall in the next or previous month
            showDaysInNextAndPreviousMonths: false,

            // Allows user to select days that fall in the next or previous month
            enableSelectionDaysInNextAndPreviousMonths: false,

            // how many months are visible
            numberOfMonths: 1,

            // when numberOfMonths is used, this will help you to choose where the main calendar will be (default `left`, can be set to `right`)
            // only used for the first display or when a selected date is not visible
            mainCalendar: 'left',

            // Specify a DOM element to render the calendar in
            container: undefined,

            // Blur field when date is selected
            blurFieldOnSelect: true,

            // internationalization
            i18n: {
                previousMonth: 'Previous Month',
                nextMonth: 'Next Month',
                months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
                weekdays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
                weekdaysShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
            },

            // Theme Classname
            theme: null,

            // events array
            events: [],

            // callback function
            onSelect: null,
            onOpen: null,
            onClose: null,
            onDraw: null,

            // Enable keyboard input
            keyboardInput: true
        },


        /**
         * templating functions to abstract HTML rendering
         */
        renderDayName = function (opts, day, abbr) {
            day += opts.firstDay;
            while (day >= 7) {
                day -= 7;
            }
            return abbr ? opts.i18n.weekdaysShort[day] : opts.i18n.weekdays[day];
        },

        renderDay = function (opts) {
            var arr = [];
            var ariaSelected = 'false';
            if (opts.isEmpty) {
                if (opts.showDaysInNextAndPreviousMonths) {
                    arr.push('is-outside-current-month');

                    if (!opts.enableSelectionDaysInNextAndPreviousMonths) {
                        arr.push('is-selection-disabled');
                    }

                } else {
                    return '<td class="is-empty"></td>';
                }
            }
            if (opts.isDisabled) {
                arr.push('is-disabled');
            }
            if (opts.isToday) {
                arr.push('is-today');
            }
            if (opts.isSelected) {
                arr.push('is-selected');
                ariaSelected = 'true';
            }
            if (opts.hasEvent) {
                arr.push('has-event');
            }
            if (opts.isInRange) {
                arr.push('is-inrange');
            }
            if (opts.isStartRange) {
                arr.push('is-startrange');
            }
            if (opts.isEndRange) {
                arr.push('is-endrange');
            }
            return '<td data-day="' + opts.day + '" class="' + arr.join(' ') + '" aria-selected="' + ariaSelected + '">' +
                '<button class="pika-button pika-day" type="button" ' +
                'data-pika-year="' + opts.year + '" data-pika-month="' + opts.month + '" data-pika-day="' + opts.day + '">' +
                opts.day +
                '</button>' +
                '</td>';
        },

        renderWeek = function (d, m, y) {
            // Lifted from http://javascript.about.com/library/blweekyear.htm, lightly modified.
            var onejan = new Date(y, 0, 1),
                weekNum = Math.ceil((((new Date(y, m, d) - onejan) / 86400000) + onejan.getDay() + 1) / 7);
            return '<td class="pika-week">' + weekNum + '</td>';
        },

        renderRow = function (days, isRTL, pickWholeWeek, isRowSelected) {
            return '<tr class="pika-row' + (pickWholeWeek ? ' pick-whole-week' : '') + (isRowSelected ? ' is-selected' : '') + '">' + (isRTL ? days.reverse() : days).join('') + '</tr>';
        },

        renderBody = function (rows) {
            return '<tbody>' + rows.join('') + '</tbody>';
        },

        renderHead = function (opts) {
            var i, arr = [];
            if (opts.showWeekNumber) {
                arr.push('<th></th>');
            }
            for (i = 0; i < 7; i++) {
                arr.push('<th scope="col"><abbr title="' + renderDayName(opts, i) + '">' + renderDayName(opts, i, true) + '</abbr></th>');
            }
            return '<thead><tr>' + (opts.isRTL ? arr.reverse() : arr).join('') + '</tr></thead>';
        },

        renderTitle = function (instance, c, year, month, refYear, randId) {
            var i, j, arr,
                opts = instance._o,
                isMinYear = year === opts.minYear,
                isMaxYear = year === opts.maxYear,
                html = '<div id="' + randId + '" class="pika-title" role="heading" aria-live="assertive">',
                monthHtml,
                yearHtml,
                prev = true,
                next = true;

            for (arr = [], i = 0; i < 12; i++) {
                arr.push('<option value="' + (year === refYear ? i - c : 12 + i - c) + '"' +
                    (i === month ? ' selected="selected"' : '') +
                    ((isMinYear && i < opts.minMonth) || (isMaxYear && i > opts.maxMonth) ? 'disabled="disabled"' : '') + '>' +
                    opts.i18n.months[i] + '</option>');
            }

            monthHtml = '<div class="pika-label">' + opts.i18n.months[month] + '<select class="pika-select pika-select-month" tabindex="-1">' + arr.join('') + '</select></div>';

            if (isArray(opts.yearRange)) {
                i = opts.yearRange[0];
                j = opts.yearRange[1] + 1;
            } else {
                i = year - opts.yearRange;
                j = 1 + year + opts.yearRange;
            }

            for (arr = []; i < j && i <= opts.maxYear; i++) {
                if (i >= opts.minYear) {
                    arr.push('<option value="' + i + '"' + (i === year ? ' selected="selected"' : '') + '>' + (i) + '</option>');
                }
            }
            yearHtml = '<div class="pika-label">' + year + opts.yearSuffix + '<select class="pika-select pika-select-year" tabindex="-1">' + arr.join('') + '</select></div>';

            if (opts.showMonthAfterYear) {
                html += yearHtml + monthHtml;
            } else {
                html += monthHtml + yearHtml;
            }

            if (isMinYear && (month === 0 || opts.minMonth >= month)) {
                prev = false;
            }

            if (isMaxYear && (month === 11 || opts.maxMonth <= month)) {
                next = false;
            }

            if (c === 0) {
                html += '<button class="pika-prev' + (prev ? '' : ' is-disabled') + '" type="button">' + opts.i18n.previousMonth + '</button>';
            }
            if (c === (instance._o.numberOfMonths - 1)) {
                html += '<button class="pika-next' + (next ? '' : ' is-disabled') + '" type="button">' + opts.i18n.nextMonth + '</button>';
            }

            return html += '</div>';
        },

        renderTable = function (opts, data, randId) {
            return '<table cellpadding="0" cellspacing="0" class="pika-table" role="grid" aria-labelledby="' + randId + '">' + renderHead(opts) + renderBody(data) + '</table>';
        },


        /**
         * Pikaday constructor
         */
        Pikaday = function (options) {
            var self = this,
                opts = self.config(options);

            self._onMouseDown = function (e) {
                if (!self._v) {
                    return;
                }
                e = e || window.event;
                var target = e.target || e.srcElement;
                if (!target) {
                    return;
                }

                if (!hasClass(target, 'is-disabled')) {
                    if (hasClass(target, 'pika-button') && !hasClass(target, 'is-empty') && !hasClass(target.parentNode, 'is-disabled')) {
                        self.setDate(new Date(target.getAttribute('data-pika-year'), target.getAttribute('data-pika-month'), target.getAttribute('data-pika-day')));
                        if (opts.bound) {
                            sto(function () {
                                self.hide();
                                if (opts.blurFieldOnSelect && opts.field) {
                                    opts.field.blur();
                                }
                            }, 100);
                        }
                    }
                    else if (hasClass(target, 'pika-prev')) {
                        self.prevMonth();
                    }
                    else if (hasClass(target, 'pika-next')) {
                        self.nextMonth();
                    }
                }
                if (!hasClass(target, 'pika-select')) {
                    // if this is touch event prevent mouse events emulation
                    if (e.preventDefault) {
                        e.preventDefault();
                    } else {
                        e.returnValue = false;
                        return false;
                    }
                } else {
                    self._c = true;
                }
            };

            self._onChange = function (e) {
                e = e || window.event;
                var target = e.target || e.srcElement;
                if (!target) {
                    return;
                }
                if (hasClass(target, 'pika-select-month')) {
                    self.gotoMonth(target.value);
                }
                else if (hasClass(target, 'pika-select-year')) {
                    self.gotoYear(target.value);
                }
            };

            self._onKeyChange = function (e) {
                e = e || window.event;

                if (self.isVisible()) {

                    switch (e.keyCode) {
                        case 13:
                        case 27:
                            if (opts.field) {
                                opts.field.blur();
                            }
                            break;
                        case 37:
                            e.preventDefault();
                            self.adjustDate('subtract', 1);
                            break;
                        case 38:
                            self.adjustDate('subtract', 7);
                            break;
                        case 39:
                            self.adjustDate('add', 1);
                            break;
                        case 40:
                            self.adjustDate('add', 7);
                            break;
                    }
                }
            };

            self._onInputChange = function (e) {
                var date;

                if (e.firedBy === self) {
                    return;
                }
                if (opts.parse) {
                    date = opts.parse(opts.field.value, opts.format);
                } else if (hasMoment) {
                    date = moment(opts.field.value, opts.format, opts.formatStrict);
                    date = (date && date.isValid()) ? date.toDate() : null;
                }
                else {
                    date = new Date(Date.parse(opts.field.value));
                }
                if (isDate(date)) {
                    self.setDate(date);
                }
                if (!self._v) {
                    self.show();
                }
            };

            self._onInputFocus = function () {
                self.show();
            };

            self._onInputClick = function () {
                self.show();
            };

            self._onInputBlur = function () {
                // IE allows pika div to gain focus; catch blur the input field
                var pEl = document.activeElement;
                do {
                    if (hasClass(pEl, 'pika-single')) {
                        return;
                    }
                }
                while ((pEl = pEl.parentNode));

                if (!self._c) {
                    self._b = sto(function () {
                        self.hide();
                    }, 50);
                }
                self._c = false;
            };

            self._onClick = function (e) {
                e = e || window.event;
                var target = e.target || e.srcElement,
                    pEl = target;
                if (!target) {
                    return;
                }
                if (!hasEventListeners && hasClass(target, 'pika-select')) {
                    if (!target.onchange) {
                        target.setAttribute('onchange', 'return;');
                        addEvent(target, 'change', self._onChange);
                    }
                }
                do {
                    if (hasClass(pEl, 'pika-single') || pEl === opts.trigger) {
                        return;
                    }
                }
                while ((pEl = pEl.parentNode));
                if (self._v && target !== opts.trigger && pEl !== opts.trigger) {
                    self.hide();
                }
            };

            self.el = document.createElement('div');
            self.el.className = 'pika-single' + (opts.isRTL ? ' is-rtl' : '') + (opts.theme ? ' ' + opts.theme : '');

            addEvent(self.el, 'mousedown', self._onMouseDown, true);
            addEvent(self.el, 'touchend', self._onMouseDown, true);
            addEvent(self.el, 'change', self._onChange);

            if (opts.keyboardInput) {
                addEvent(document, 'keydown', self._onKeyChange);
            }

            if (opts.field) {
                if (opts.container) {
                    opts.container.appendChild(self.el);
                } else if (opts.bound) {
                    document.body.appendChild(self.el);
                } else {
                    opts.field.parentNode.insertBefore(self.el, opts.field.nextSibling);
                }
                addEvent(opts.field, 'change', self._onInputChange);

                if (!opts.defaultDate) {
                    if (hasMoment && opts.field.value) {
                        opts.defaultDate = moment(opts.field.value, opts.format).toDate();
                    } else {
                        opts.defaultDate = new Date(Date.parse(opts.field.value));
                    }
                    opts.setDefaultDate = true;
                }
            }

            var defDate = opts.defaultDate;

            if (isDate(defDate)) {
                if (opts.setDefaultDate) {
                    self.setDate(defDate, true);
                } else {
                    self.gotoDate(defDate);
                }
            } else {
                self.gotoDate(new Date());
            }

            if (opts.bound) {
                this.hide();
                self.el.className += ' is-bound';
                addEvent(opts.trigger, 'click', self._onInputClick);
                addEvent(opts.trigger, 'focus', self._onInputFocus);
                addEvent(opts.trigger, 'blur', self._onInputBlur);
            } else {
                this.show();
            }
        };


    /**
     * public Pikaday API
     */
    Pikaday.prototype = {


        /**
         * configure functionality
         */
        config: function (options) {
            if (!this._o) {
                this._o = extend({}, defaults, true);
            }

            var opts = extend(this._o, options, true);

            opts.isRTL = !!opts.isRTL;

            opts.field = (opts.field && opts.field.nodeName) ? opts.field : null;

            opts.theme = (typeof opts.theme) === 'string' && opts.theme ? opts.theme : null;

            opts.bound = !!(opts.bound !== undefined ? opts.field && opts.bound : opts.field);

            opts.trigger = (opts.trigger && opts.trigger.nodeName) ? opts.trigger : opts.field;

            opts.disableWeekends = !!opts.disableWeekends;

            opts.disableDayFn = (typeof opts.disableDayFn) === 'function' ? opts.disableDayFn : null;

            var nom = parseInt(opts.numberOfMonths, 10) || 1;
            opts.numberOfMonths = nom > 4 ? 4 : nom;

            if (!isDate(opts.minDate)) {
                opts.minDate = false;
            }
            if (!isDate(opts.maxDate)) {
                opts.maxDate = false;
            }
            if ((opts.minDate && opts.maxDate) && opts.maxDate < opts.minDate) {
                opts.maxDate = opts.minDate = false;
            }
            if (opts.minDate) {
                this.setMinDate(opts.minDate);
            }
            if (opts.maxDate) {
                this.setMaxDate(opts.maxDate);
            }

            if (isArray(opts.yearRange)) {
                var fallback = new Date().getFullYear() - 10;
                opts.yearRange[0] = parseInt(opts.yearRange[0], 10) || fallback;
                opts.yearRange[1] = parseInt(opts.yearRange[1], 10) || fallback;
            } else {
                opts.yearRange = Math.abs(parseInt(opts.yearRange, 10)) || defaults.yearRange;
                if (opts.yearRange > 100) {
                    opts.yearRange = 100;
                }
            }

            return opts;
        },

        /**
         * return a formatted string of the current selection (using Moment.js if available)
         */
        toString: function (format) {
            format = format || this._o.format;
            if (!isDate(this._d)) {
                return '';
            }
            if (this._o.toString) {
                return this._o.toString(this._d, format);
            }
            if (hasMoment) {
                return moment(this._d).format(format);
            }
            return this._d.toDateString();
        },

        /**
         * return a Moment.js object of the current selection (if available)
         */
        getMoment: function () {
            return hasMoment ? moment(this._d) : null;
        },

        /**
         * set the current selection from a Moment.js object (if available)
         */
        setMoment: function (date, preventOnSelect) {
            if (hasMoment && moment.isMoment(date)) {
                this.setDate(date.toDate(), preventOnSelect);
            }
        },

        /**
         * return a Date object of the current selection
         */
        getDate: function () {
            return isDate(this._d) ? new Date(this._d.getTime()) : null;
        },

        /**
         * set the current selection
         */
        setDate: function (date, preventOnSelect) {
            if (!date) {
                this._d = null;

                if (this._o.field) {
                    this._o.field.value = '';
                    fireEvent(this._o.field, 'change', { firedBy: this });
                }

                return this.draw();
            }
            if (typeof date === 'string') {
                date = new Date(Date.parse(date));
            }
            if (!isDate(date)) {
                return;
            }

            var min = this._o.minDate,
                max = this._o.maxDate;

            if (isDate(min) && date < min) {
                date = min;
            } else if (isDate(max) && date > max) {
                date = max;
            }

            this._d = new Date(date.getTime());
            setToStartOfDay(this._d);
            this.gotoDate(this._d);

            if (this._o.field) {
                this._o.field.value = this.toString();
                fireEvent(this._o.field, 'change', { firedBy: this });
            }
            if (!preventOnSelect && typeof this._o.onSelect === 'function') {
                this._o.onSelect.call(this, this.getDate());
            }
        },

        /**
         * change view to a specific date
         */
        gotoDate: function (date) {
            var newCalendar = true;

            if (!isDate(date)) {
                return;
            }

            if (this.calendars) {
                var firstVisibleDate = new Date(this.calendars[0].year, this.calendars[0].month, 1),
                    lastVisibleDate = new Date(this.calendars[this.calendars.length - 1].year, this.calendars[this.calendars.length - 1].month, 1),
                    visibleDate = date.getTime();
                // get the end of the month
                lastVisibleDate.setMonth(lastVisibleDate.getMonth() + 1);
                lastVisibleDate.setDate(lastVisibleDate.getDate() - 1);
                newCalendar = (visibleDate < firstVisibleDate.getTime() || lastVisibleDate.getTime() < visibleDate);
            }

            if (newCalendar) {
                this.calendars = [{
                    month: date.getMonth(),
                    year: date.getFullYear()
                }];
                if (this._o.mainCalendar === 'right') {
                    this.calendars[0].month += 1 - this._o.numberOfMonths;
                }
            }

            this.adjustCalendars();
        },

        adjustDate: function (sign, days) {

            var day = this.getDate() || new Date();
            var difference = parseInt(days) * 24 * 60 * 60 * 1000;

            var newDay;

            if (sign === 'add') {
                newDay = new Date(day.valueOf() + difference);
            } else if (sign === 'subtract') {
                newDay = new Date(day.valueOf() - difference);
            }

            this.setDate(newDay);
        },

        adjustCalendars: function () {
            this.calendars[0] = adjustCalendar(this.calendars[0]);
            for (var c = 1; c < this._o.numberOfMonths; c++) {
                this.calendars[c] = adjustCalendar({
                    month: this.calendars[0].month + c,
                    year: this.calendars[0].year
                });
            }
            this.draw();
        },

        gotoToday: function () {
            this.gotoDate(new Date());
        },

        /**
         * change view to a specific month (zero-index, e.g. 0: January)
         */
        gotoMonth: function (month) {
            if (!isNaN(month)) {
                this.calendars[0].month = parseInt(month, 10);
                this.adjustCalendars();
            }
        },

        nextMonth: function () {
            this.calendars[0].month++;
            this.adjustCalendars();
        },

        prevMonth: function () {
            this.calendars[0].month--;
            this.adjustCalendars();
        },

        /**
         * change view to a specific full year (e.g. "2012")
         */
        gotoYear: function (year) {
            if (!isNaN(year)) {
                this.calendars[0].year = parseInt(year, 10);
                this.adjustCalendars();
            }
        },

        /**
         * change the minDate
         */
        setMinDate: function (value) {
            if (value instanceof Date) {
                setToStartOfDay(value);
                this._o.minDate = value;
                this._o.minYear = value.getFullYear();
                this._o.minMonth = value.getMonth();
            } else {
                this._o.minDate = defaults.minDate;
                this._o.minYear = defaults.minYear;
                this._o.minMonth = defaults.minMonth;
                this._o.startRange = defaults.startRange;
            }

            this.draw();
        },

        /**
         * change the maxDate
         */
        setMaxDate: function (value) {
            if (value instanceof Date) {
                setToStartOfDay(value);
                this._o.maxDate = value;
                this._o.maxYear = value.getFullYear();
                this._o.maxMonth = value.getMonth();
            } else {
                this._o.maxDate = defaults.maxDate;
                this._o.maxYear = defaults.maxYear;
                this._o.maxMonth = defaults.maxMonth;
                this._o.endRange = defaults.endRange;
            }

            this.draw();
        },

        setStartRange: function (value) {
            this._o.startRange = value;
        },

        setEndRange: function (value) {
            this._o.endRange = value;
        },

        /**
         * refresh the HTML
         */
        draw: function (force) {
            if (!this._v && !force) {
                return;
            }
            var opts = this._o,
                minYear = opts.minYear,
                maxYear = opts.maxYear,
                minMonth = opts.minMonth,
                maxMonth = opts.maxMonth,
                html = '',
                randId;

            if (this._y <= minYear) {
                this._y = minYear;
                if (!isNaN(minMonth) && this._m < minMonth) {
                    this._m = minMonth;
                }
            }
            if (this._y >= maxYear) {
                this._y = maxYear;
                if (!isNaN(maxMonth) && this._m > maxMonth) {
                    this._m = maxMonth;
                }
            }

            randId = 'pika-title-' + Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 2);

            for (var c = 0; c < opts.numberOfMonths; c++) {
                html += '<div class="pika-lendar">' + renderTitle(this, c, this.calendars[c].year, this.calendars[c].month, this.calendars[0].year, randId) + this.render(this.calendars[c].year, this.calendars[c].month, randId) + '</div>';
            }

            this.el.innerHTML = html;

            if (opts.bound) {
                if (opts.field.type !== 'hidden') {
                    sto(function () {
                        opts.trigger.focus();
                    }, 1);
                }
            }

            if (typeof this._o.onDraw === 'function') {
                this._o.onDraw(this);
            }

            if (opts.bound) {
                // let the screen reader user know to use arrow keys
                opts.field.setAttribute('aria-label', opts.ariaLabel);
            }
        },

        adjustPosition: function () {
            var field, pEl, width, height, viewportWidth, viewportHeight, scrollTop, left, top, clientRect;

            if (this._o.container) return;

            this.el.style.position = 'absolute';

            field = this._o.trigger;
            pEl = field;
            width = this.el.offsetWidth;
            height = this.el.offsetHeight;
            viewportWidth = window.innerWidth || document.documentElement.clientWidth;
            viewportHeight = window.innerHeight || document.documentElement.clientHeight;
            scrollTop = window.pageYOffset || document.body.scrollTop || document.documentElement.scrollTop;

            if (typeof field.getBoundingClientRect === 'function') {
                clientRect = field.getBoundingClientRect();
                left = clientRect.left + window.pageXOffset;
                top = clientRect.bottom + window.pageYOffset;
            } else {
                left = pEl.offsetLeft;
                top = pEl.offsetTop + pEl.offsetHeight;
                while ((pEl = pEl.offsetParent)) {
                    left += pEl.offsetLeft;
                    top += pEl.offsetTop;
                }
            }

            // default position is bottom & left
            if ((this._o.reposition && left + width > viewportWidth) ||
                (
                    this._o.position.indexOf('right') > -1 &&
                    left - width + field.offsetWidth > 0
                )
            ) {
                left = left - width + field.offsetWidth;
            }
            if ((this._o.reposition && top + height > viewportHeight + scrollTop) ||
                (
                    this._o.position.indexOf('top') > -1 &&
                    top - height - field.offsetHeight > 0
                )
            ) {
                top = top - height - field.offsetHeight;
            }

            this.el.style.left = left + 'px';
            this.el.style.top = top + 'px';
        },

        /**
         * render HTML for a particular month
         */
        render: function (year, month, randId) {
            var opts = this._o,
                now = new Date(),
                days = getDaysInMonth(year, month),
                before = new Date(year, month, 1).getDay(),
                data = [],
                row = [];
            setToStartOfDay(now);
            if (opts.firstDay > 0) {
                before -= opts.firstDay;
                if (before < 0) {
                    before += 7;
                }
            }
            var previousMonth = month === 0 ? 11 : month - 1,
                nextMonth = month === 11 ? 0 : month + 1,
                yearOfPreviousMonth = month === 0 ? year - 1 : year,
                yearOfNextMonth = month === 11 ? year + 1 : year,
                daysInPreviousMonth = getDaysInMonth(yearOfPreviousMonth, previousMonth);
            var cells = days + before,
                after = cells;
            while (after > 7) {
                after -= 7;
            }
            cells += 7 - after;
            var isWeekSelected = false;
            for (var i = 0, r = 0; i < cells; i++) {
                var day = new Date(year, month, 1 + (i - before)),
                    isSelected = isDate(this._d) ? compareDates(day, this._d) : false,
                    isToday = compareDates(day, now),
                    hasEvent = opts.events.indexOf(day.toDateString()) !== -1 ? true : false,
                    isEmpty = i < before || i >= (days + before),
                    dayNumber = 1 + (i - before),
                    monthNumber = month,
                    yearNumber = year,
                    isStartRange = opts.startRange && compareDates(opts.startRange, day),
                    isEndRange = opts.endRange && compareDates(opts.endRange, day),
                    isInRange = opts.startRange && opts.endRange && opts.startRange < day && day < opts.endRange,
                    isDisabled = (opts.minDate && day < opts.minDate) ||
                        (opts.maxDate && day > opts.maxDate) ||
                        (opts.disableWeekends && isWeekend(day)) ||
                        (opts.disableDayFn && opts.disableDayFn(day));

                if (isEmpty) {
                    if (i < before) {
                        dayNumber = daysInPreviousMonth + dayNumber;
                        monthNumber = previousMonth;
                        yearNumber = yearOfPreviousMonth;
                    } else {
                        dayNumber = dayNumber - days;
                        monthNumber = nextMonth;
                        yearNumber = yearOfNextMonth;
                    }
                }

                var dayConfig = {
                    day: dayNumber,
                    month: monthNumber,
                    year: yearNumber,
                    hasEvent: hasEvent,
                    isSelected: isSelected,
                    isToday: isToday,
                    isDisabled: isDisabled,
                    isEmpty: isEmpty,
                    isStartRange: isStartRange,
                    isEndRange: isEndRange,
                    isInRange: isInRange,
                    showDaysInNextAndPreviousMonths: opts.showDaysInNextAndPreviousMonths,
                    enableSelectionDaysInNextAndPreviousMonths: opts.enableSelectionDaysInNextAndPreviousMonths
                };

                if (opts.pickWholeWeek && isSelected) {
                    isWeekSelected = true;
                }

                row.push(renderDay(dayConfig));

                if (++r === 7) {
                    if (opts.showWeekNumber) {
                        row.unshift(renderWeek(i - before, month, year));
                    }
                    data.push(renderRow(row, opts.isRTL, opts.pickWholeWeek, isWeekSelected));
                    row = [];
                    r = 0;
                    isWeekSelected = false;
                }
            }
            return renderTable(opts, data, randId);
        },

        isVisible: function () {
            return this._v;
        },

        show: function () {
            if (!this.isVisible()) {
                this._v = true;
                this.draw();
                removeClass(this.el, 'is-hidden');
                if (this._o.bound) {
                    addEvent(document, 'click', this._onClick);
                    this.adjustPosition();
                }
                if (typeof this._o.onOpen === 'function') {
                    this._o.onOpen.call(this);
                }
            }
        },

        hide: function () {
            var v = this._v;
            if (v !== false) {
                if (this._o.bound) {
                    removeEvent(document, 'click', this._onClick);
                }
                this.el.style.position = 'static'; // reset
                this.el.style.left = 'auto';
                this.el.style.top = 'auto';
                addClass(this.el, 'is-hidden');
                this._v = false;
                if (v !== undefined && typeof this._o.onClose === 'function') {
                    this._o.onClose.call(this);
                }
            }
        },

        /**
         * GAME OVER
         */
        destroy: function () {
            var opts = this._o;

            this.hide();
            removeEvent(this.el, 'mousedown', this._onMouseDown, true);
            removeEvent(this.el, 'touchend', this._onMouseDown, true);
            removeEvent(this.el, 'change', this._onChange);
            if (opts.keyboardInput) {
                removeEvent(document, 'keydown', this._onKeyChange);
            }
            if (opts.field) {
                removeEvent(opts.field, 'change', this._onInputChange);
                if (opts.bound) {
                    removeEvent(opts.trigger, 'click', this._onInputClick);
                    removeEvent(opts.trigger, 'focus', this._onInputFocus);
                    removeEvent(opts.trigger, 'blur', this._onInputBlur);
                }
            }
            if (this.el.parentNode) {
                this.el.parentNode.removeChild(this.el);
            }
        }

    };

    return Pikaday;
}));
/**
 * Copyright (c) 2011-2014 Felix Gnass
 * Licensed under the MIT license
 * http://spin.js.org/
 *
 * Example:
    var opts = {
      lines: 12             // The number of lines to draw
    , length: 7             // The length of each line
    , width: 5              // The line thickness
    , radius: 10            // The radius of the inner circle
    , scale: 1.0            // Scales overall size of the spinner
    , corners: 1            // Roundness (0..1)
    , color: '#000'         // #rgb or #rrggbb
    , opacity: 1/4          // Opacity of the lines
    , rotate: 0             // Rotation offset
    , direction: 1          // 1: clockwise, -1: counterclockwise
    , speed: 1              // Rounds per second
    , trail: 100            // Afterglow percentage
    , fps: 20               // Frames per second when using setTimeout()
    , zIndex: 2e9           // Use a high z-index by default
    , className: 'spinner'  // CSS class to assign to the element
    , top: '50%'            // center vertically
    , left: '50%'           // center horizontally
    , shadow: false         // Whether to render a shadow
    , hwaccel: false        // Whether to use hardware acceleration (might be buggy)
    , position: 'absolute'  // Element positioning
    }
    var target = document.getElementById('foo')
    var spinner = new Spinner(opts).spin(target)
 */
; (function (root, factory) {

    /* CommonJS */
    if (typeof module == 'object' && module.exports) module.exports = factory()

    /* AMD module */
    else if (typeof define == 'function' && define.amd) define(factory)

    /* Browser global */
    else root.Spinner = factory()
}(this, function () {
    "use strict"

    var prefixes = ['webkit', 'Moz', 'ms', 'O'] /* Vendor prefixes */
        , animations = {} /* Animation rules keyed by their name */
        , useCssAnimations /* Whether to use CSS animations or setTimeout */
        , sheet /* A stylesheet to hold the @keyframe or VML rules. */

    /**
     * Utility function to create elements. If no tag name is given,
     * a DIV is created. Optionally properties can be passed.
     */
    function createEl(tag, prop) {
        var el = document.createElement(tag || 'div')
            , n

        for (n in prop) el[n] = prop[n]
        return el
    }

    /**
     * Appends children and returns the parent.
     */
    function ins(parent /* child1, child2, ...*/) {
        for (var i = 1, n = arguments.length; i < n; i++) {
            parent.appendChild(arguments[i])
        }

        return parent
    }

    /**
     * Creates an opacity keyframe animation rule and returns its name.
     * Since most mobile Webkits have timing issues with animation-delay,
     * we create separate rules for each line/segment.
     */
    function addAnimation(alpha, trail, i, lines) {
        var name = ['opacity', trail, ~~(alpha * 100), i, lines].join('-')
            , start = 0.01 + i / lines * 100
            , z = Math.max(1 - (1 - alpha) / trail * (100 - start), alpha)
            , prefix = useCssAnimations.substring(0, useCssAnimations.indexOf('Animation')).toLowerCase()
            , pre = prefix && '-' + prefix + '-' || ''

        if (!animations[name]) {
            sheet.insertRule(
                '@' + pre + 'keyframes ' + name + '{' +
                '0%{opacity:' + z + '}' +
                start + '%{opacity:' + alpha + '}' +
                (start + 0.01) + '%{opacity:1}' +
                (start + trail) % 100 + '%{opacity:' + alpha + '}' +
                '100%{opacity:' + z + '}' +
                '}', sheet.cssRules.length)

            animations[name] = 1
        }

        return name
    }

    /**
     * Tries various vendor prefixes and returns the first supported property.
     */
    function vendor(el, prop) {
        var s = el.style
            , pp
            , i

        prop = prop.charAt(0).toUpperCase() + prop.slice(1)
        if (s[prop] !== undefined) return prop
        for (i = 0; i < prefixes.length; i++) {
            pp = prefixes[i] + prop
            if (s[pp] !== undefined) return pp
        }
    }

    /**
     * Sets multiple style properties at once.
     */
    function css(el, prop) {
        for (var n in prop) {
            el.style[vendor(el, n) || n] = prop[n]
        }

        return el
    }

    /**
     * Fills in default values.
     */
    function merge(obj) {
        for (var i = 1; i < arguments.length; i++) {
            var def = arguments[i]
            for (var n in def) {
                if (obj[n] === undefined) obj[n] = def[n]
            }
        }
        return obj
    }

    /**
     * Returns the line color from the given string or array.
     */
    function getColor(color, idx) {
        return typeof color == 'string' ? color : color[idx % color.length]
    }

    // Built-in defaults

    var defaults = {
        lines: 12             // The number of lines to draw
        , length: 7             // The length of each line
        , width: 5              // The line thickness
        , radius: 10            // The radius of the inner circle
        , scale: 1.0            // Scales overall size of the spinner
        , corners: 1            // Roundness (0..1)
        , color: '#000'         // #rgb or #rrggbb
        , opacity: 1 / 4          // Opacity of the lines
        , rotate: 0             // Rotation offset
        , direction: 1          // 1: clockwise, -1: counterclockwise
        , speed: 1              // Rounds per second
        , trail: 100            // Afterglow percentage
        , fps: 20               // Frames per second when using setTimeout()
        , zIndex: 2e9           // Use a high z-index by default
        , className: 'spinner'  // CSS class to assign to the element
        , top: '50%'            // center vertically
        , left: '50%'           // center horizontally
        , shadow: false         // Whether to render a shadow
        , hwaccel: false        // Whether to use hardware acceleration (might be buggy)
        , position: 'absolute'  // Element positioning
    }

    /** The constructor */
    function Spinner(o) {
        this.opts = merge(o || {}, Spinner.defaults, defaults)
    }

    // Global defaults that override the built-ins:
    Spinner.defaults = {}

    merge(Spinner.prototype, {
        /**
         * Adds the spinner to the given target element. If this instance is already
         * spinning, it is automatically removed from its previous target b calling
         * stop() internally.
         */
        spin: function (target) {
            this.stop()

            var self = this
                , o = self.opts
                , el = self.el = createEl(null, { className: o.className })

            css(el, {
                position: o.position
                , width: 0
                , zIndex: o.zIndex
                , left: o.left
                , top: o.top
            })

            if (target) {
                target.insertBefore(el, target.firstChild || null)
            }

            el.setAttribute('role', 'progressbar')
            self.lines(el, self.opts)

            if (!useCssAnimations) {
                // No CSS animation support, use setTimeout() instead
                var i = 0
                    , start = (o.lines - 1) * (1 - o.direction) / 2
                    , alpha
                    , fps = o.fps
                    , f = fps / o.speed
                    , ostep = (1 - o.opacity) / (f * o.trail / 100)
                    , astep = f / o.lines

                    ; (function anim() {
                        i++
                        for (var j = 0; j < o.lines; j++) {
                            alpha = Math.max(1 - (i + (o.lines - j) * astep) % f * ostep, o.opacity)

                            self.opacity(el, j * o.direction + start, alpha, o)
                        }
                        self.timeout = self.el && setTimeout(anim, ~~(1000 / fps))
                    })()
            }
            return self
        }

        /**
         * Stops and removes the Spinner.
         */
        , stop: function () {
            var el = this.el
            if (el) {
                clearTimeout(this.timeout)
                if (el.parentNode) el.parentNode.removeChild(el)
                this.el = undefined
            }
            return this
        }

        /**
         * Internal method that draws the individual lines. Will be overwritten
         * in VML fallback mode below.
         */
        , lines: function (el, o) {
            var i = 0
                , start = (o.lines - 1) * (1 - o.direction) / 2
                , seg

            function fill(color, shadow) {
                return css(createEl(), {
                    position: 'absolute'
                    , width: o.scale * (o.length + o.width) + 'px'
                    , height: o.scale * o.width + 'px'
                    , background: color
                    , boxShadow: shadow
                    , transformOrigin: 'left'
                    , transform: 'rotate(' + ~~(360 / o.lines * i + o.rotate) + 'deg) translate(' + o.scale * o.radius + 'px' + ',0)'
                    , borderRadius: (o.corners * o.scale * o.width >> 1) + 'px'
                })
            }

            for (; i < o.lines; i++) {
                seg = css(createEl(), {
                    position: 'absolute'
                    , top: 1 + ~(o.scale * o.width / 2) + 'px'
                    , transform: o.hwaccel ? 'translate3d(0,0,0)' : ''
                    , opacity: o.opacity
                    , animation: useCssAnimations && addAnimation(o.opacity, o.trail, start + i * o.direction, o.lines) + ' ' + 1 / o.speed + 's linear infinite'
                })

                if (o.shadow) ins(seg, css(fill('#000', '0 0 4px #000'), { top: '2px' }))
                ins(el, ins(seg, fill(getColor(o.color, i), '0 0 1px rgba(0,0,0,.1)')))
            }
            return el
        }

        /**
         * Internal method that adjusts the opacity of a single line.
         * Will be overwritten in VML fallback mode below.
         */
        , opacity: function (el, i, val) {
            if (i < el.childNodes.length) el.childNodes[i].style.opacity = val
        }

    })


    function initVML() {

        /* Utility function to create a VML tag */
        function vml(tag, attr) {
            return createEl('<' + tag + ' xmlns="urn:schemas-microsoft.com:vml" class="spin-vml">', attr)
        }

        // No CSS transforms but VML support, add a CSS rule for VML elements:
        sheet.addRule('.spin-vml', 'behavior:url(#default#VML)')

        Spinner.prototype.lines = function (el, o) {
            var r = o.scale * (o.length + o.width)
                , s = o.scale * 2 * r

            function grp() {
                return css(
                    vml('group', {
                        coordsize: s + ' ' + s
                        , coordorigin: -r + ' ' + -r
                    })
                    , { width: s, height: s }
                )
            }

            var margin = -(o.width + o.length) * o.scale * 2 + 'px'
                , g = css(grp(), { position: 'absolute', top: margin, left: margin })
                , i

            function seg(i, dx, filter) {
                ins(
                    g
                    , ins(
                        css(grp(), { rotation: 360 / o.lines * i + 'deg', left: ~~dx })
                        , ins(
                            css(
                                vml('roundrect', { arcsize: o.corners })
                                , {
                                    width: r
                                    , height: o.scale * o.width
                                    , left: o.scale * o.radius
                                    , top: -o.scale * o.width >> 1
                                    , filter: filter
                                }
                            )
                            , vml('fill', { color: getColor(o.color, i), opacity: o.opacity })
                            , vml('stroke', { opacity: 0 }) // transparent stroke to fix color bleeding upon opacity change
                        )
                    )
                )
            }

            if (o.shadow)
                for (i = 1; i <= o.lines; i++) {
                    seg(i, -2, 'progid:DXImageTransform.Microsoft.Blur(pixelradius=2,makeshadow=1,shadowopacity=.3)')
                }

            for (i = 1; i <= o.lines; i++) seg(i)
            return ins(el, g)
        }

        Spinner.prototype.opacity = function (el, i, val, o) {
            var c = el.firstChild
            o = o.shadow && o.lines || 0
            if (c && i + o < c.childNodes.length) {
                c = c.childNodes[i + o]; c = c && c.firstChild; c = c && c.firstChild
                if (c) c.opacity = val
            }
        }
    }

    if (typeof document !== 'undefined') {
        sheet = (function () {
            var el = createEl('style', { type: 'text/css' })
            ins(document.getElementsByTagName('head')[0], el)
            return el.sheet || el.styleSheet
        }())

        var probe = css(createEl('group'), { behavior: 'url(#default#VML)' })

        if (!vendor(probe, 'transform') && probe.adj) initVML()
        else useCssAnimations = vendor(probe, 'animation')
    }

    return Spinner

}));
var XL_LIB = {
    plugins: {},
    registerPlugin: function (name, plugin) {
        this.plugins[name] = plugin();
        if (this.plugins[name] && this.plugins[name].init) {
            this.plugins[name].init();
        }
    },
    deepExtend: function (out) {
        out = out || {};

        for (var i = 1; i < arguments.length; i++) {
            var obj = arguments[i];

            if (!obj)
                continue;

            for (var key in obj) {
                if (obj.hasOwnProperty(key)) {
                    if (typeof obj[key] === 'object')
                        out[key] = XL_LIB.deepExtend(out[key], obj[key]);
                    else
                        out[key] = obj[key];
                }
            }
        }

        return out;
    }
};



XL_LIB.registerPlugin("dom", function () {

    function getSiblings(el) {
        return Array.prototype.filter.call(el.parentNode.children, function (child) {
            return child !== el;
        });
    }

    function each(collection, func) {
        Array.prototype.forEach.call(collection, func);
    }

    function find(el, selector) {
        return el.querySelectorAll(selector);
    }

    function findOne(el, selector) {
        var result = el.querySelectorAll(selector);
        if (result.length > 0) {
            return result[0];
        }
        return null;
    }

    function filterOne(collection, filterFn) {
        var result = filter(collection, filterFn);
        if (result.length > 0) {
            return result[0];
        }
        return null;
    }

    function filter(collection, filterFn) {
        return Array.prototype.filter.call(collection, filterFn);
    }

    return {
        getSiblings: getSiblings,
        each: each,
        find: find,
        findOne: findOne,
        filter: filter,
        filterOne: filterOne
    };

});
XL_LIB.registerPlugin("autoComplete", function () {

    var plugin = function (el, sourceFn) {

        return new autoComplete({
            selector: el,
            minChars: 2,
            source: sourceFn,
            renderItem: function (item, search, isStartWithSearch) {                
                var result = "";
                var itemContent = "";
                var itemValue = "";
                var i;
                var multipleParts = false;
                if (typeof item === "string") {
                    itemContent = item;
                    itemValue = item;
                }
                else {
                    multipleParts = true;
                    for (i = 0; i < item.length; i++) {
                        itemContent += '<span class="autocomplete-suggestion__part">' + item[i] + '</span>';
                        itemValue += (itemValue ? ", " : "") + item[i];
                    }
                }
		    	/*
		    	search = search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
				var re = new RegExp("(" + search.split(' ').join('|') + ")", "gi");
				*/
                result = '<div class="autocomplete-suggestion' + (multipleParts ? ' autocomplete-suggestion--multi-parts' : '') + '" data-val="' + itemValue + '">' + itemContent + '</div>';

                return result;

            }
        });

    };

    return plugin;

});


XL_LIB.registerPlugin("select", function () {

    var selectStore = {};
    var selectCounter = 0;

    function Select(choicesInstance) {

        var that = this;

        this._choicesInstance = choicesInstance;

        this.setChoices = function (choices) {

            that._choicesInstance.setChoices(choices, 'value', 'label', true);

            that._choicesInstance.setValueByChoice(choices[0].value);

        };

        this.OnSelect = function (onSelectChangeEvent) {
            that._choicesInstance.passedElement.addEventListener('choice', function (event) {                
                onSelectChangeEvent(event.detail.choice.value, event.detail.choice.label);

            }, false);
        };

        this.destroy = function () {
            that._choicesInstance.destroy();
        };

    }

    function createSelect(el, opts) {

        opts = opts || {};

        var defaults = {
            "itemSelectText": "",
            "classNames": {
                containerOuter: 'select',
                containerInner: 'select__inner',
                input: 'select__input',
                inputCloned: 'select__input--cloned',
                list: 'select__list',
                listItems: 'select__list--multiple',
                listSingle: 'select__list--single',
                listDropdown: 'select__list--dropdown',
                item: 'select__item',
                itemSelectable: 'select__item--selectable',
                itemDisabled: 'select__item--disabled',
                itemOption: 'select__item--choice',
                group: 'select__group',
                groupHeading: 'select__heading',
                button: 'select__button',
                activeState: 'is-active',
                focusState: 'is-focused',
                openState: 'is-open',
                disabledState: 'is-disabled',
                highlightedState: 'is-highlighted',
                hiddenState: 'is-hidden',
                flippedState: 'is-flipped',
                selectedState: 'is-highlighted'
            },
            searchEnabled: false,
            callbackOnCreateTemplates: function (template) {

                var classNames = this.config.classNames;
                var that = this;

                /*
                                return {
                                    item: function(data) {
                
                                        var itemTemplate = "";
                                        var i = 0;
                                        var key;
                
                                        itemTemplate += "<div>";
                                            itemTemplate += '<div class="' + classNames.item + ' ' + (data.highlighted ? classNames.highlightedState : classNames.itemSelectable) + '" data-item data-id="' + data.id + '" data-value="' + data.value + '"' + (data.active ? 'aria-selected="true"' : '') + (data.disabled ? 'aria-disabled="true"' : '') + '>';
                                                itemTemplate += data.label;								
                                            itemTemplate += '</div>';
                                            itemTemplate += "<div>";
                                                for(i = 0; i < that.additionalData.length; i++) {
                                                    if(typeof that.additionalData[i] === "string") {
                                                        itemTemplate += that.additionalData[i];
                                                    }
                                                    else {
                                                        for(key in that.additionalData[i]) {
                                                            itemTemplate += "<strong>" + key + "</strong>";
                                                            itemTemplate += that.additionalData[i][key];
                                                        }
                                                    }									
                                                }
                                            itemTemplate += "</div>";
                                        itemTemplate += "</div>";
                
                                        return template(itemTemplate);
                
                                    },
                                    choice: function(data) {
                                        var choiceTemplate = "";
                                        choiceTemplate += '<div class="' + classNames.item + ' ' + classNames.itemChoice + ' ' + (data.disabled ? classNames.itemDisabled : classNames.itemSelectable) + '" data-select-text="' + that.config.itemSelectText + '" data-choice ' + (data.disabled ? 'data-choice-disabled aria-disabled="true"' : 'data-choice-selectable') + ' data-id="' + data.id + '" data-value="' + data.value + '" ' + (data.groupId > 0 ? 'role="treeitem"' : 'role="option"') + '>';
                                            choiceTemplate += data.label;
                                        choiceTemplate += '</div>';
                                        return template(choiceTemplate);
                                    }
                                };
                */
                return {
                    item: function (data) {

                        var itemTemplate = "";
                        var i = 0;
                        var key;
                        var columns;

                        if (data.customProperties && data.customProperties.columns) {
                            columns = data.customProperties.columns;
                        }

                        if (columns) {

                            itemTemplate += '<div class="select__selected-item-columns">';
                            itemTemplate += '<div class="select__selected-item select__selected-item-column select__selected-item-column--bold ' + classNames.item + ' ' + (data.highlighted ? classNames.highlightedState : classNames.itemSelectable) + '" data-item data-id="' + data.id + '" data-value="' + data.value + '"' + (data.active ? 'aria-selected="true"' : '') + (data.disabled ? 'aria-disabled="true"' : '') + '>';
                            itemTemplate += data.label;
                            itemTemplate += '</div>';

                            for (i = 0; i < columns.length; i++) {

                                if (typeof columns[i] === "string") {
                                    itemTemplate += '<div class="select__selected-item-column">';
                                    itemTemplate += columns[i];
                                    itemTemplate += "</div>";
                                }
                                else {
                                    for (key in columns[i]) {
                                        itemTemplate += '<div class="select__selected-item-column select__selected-item-column--bold">';
                                        itemTemplate += key;
                                        itemTemplate += "</div>";
                                        itemTemplate += '<div class="select__selected-item-column">';
                                        itemTemplate += columns[i][key];
                                        itemTemplate += "</div>";
                                    }
                                }

                            }

                            itemTemplate += "</div>";

                        }
                        else {

                            itemTemplate += '<div class="select__selected-item ' + classNames.item + ' ' + (data.highlighted ? classNames.highlightedState : classNames.itemSelectable) + '" data-item data-id="' + data.id + '" data-value="' + data.value + '"' + (data.active ? 'aria-selected="true"' : '') + (data.disabled ? 'aria-disabled="true"' : '') + '>';
                            itemTemplate += data.label;
                            itemTemplate += '</div>';

                        }

                        return template(itemTemplate);

                    },
                    choice: function (data) {

                        var choiceTemplate = "";
                        var columns;

                        if (data.customProperties && data.customProperties.columns) {
                            columns = data.customProperties.columns;
                        }

                        if (columns) {

                            choiceTemplate += '<div class="select__choice-columns ' + classNames.item + ' ' + classNames.itemChoice + ' ' + (data.disabled ? classNames.itemDisabled : classNames.itemSelectable) + '" data-select-text="' + that.config.itemSelectText + '" data-choice ' + (data.disabled ? 'data-choice-disabled aria-disabled="true"' : 'data-choice-selectable') + ' data-id="' + data.id + '" data-value="' + data.value + '" ' + (data.groupId > 0 ? 'role="treeitem"' : 'role="option"') + '>';
                            choiceTemplate += '<div class="select__choice-column select__choice-column--bold">';
                            choiceTemplate += data.label;
                            choiceTemplate += '</div>';

                            for (i = 0; i < columns.length; i++) {
                                if (typeof columns[i] === "string") {
                                    choiceTemplate += '<div class="select__choice-column">';
                                    choiceTemplate += columns[i];
                                    choiceTemplate += "</div>";
                                }
                                else {
                                    for (key in columns[i]) {
                                        choiceTemplate += '<div class="select__choice-column select__choice-column--bold">';
                                        choiceTemplate += key;
                                        choiceTemplate += "</div>";
                                        choiceTemplate += '<div class="select__choice-column">';
                                        choiceTemplate += columns[i][key];
                                        choiceTemplate += "</div>";
                                    }
                                }
                            }

                            choiceTemplate += "</div>";

                        }
                        else {

                            choiceTemplate += '<div class="' + classNames.item + ' ' + classNames.itemChoice + ' ' + (data.disabled ? classNames.itemDisabled : classNames.itemSelectable) + '" data-select-text="' + that.config.itemSelectText + '" data-choice ' + (data.disabled ? 'data-choice-disabled aria-disabled="true"' : 'data-choice-selectable') + ' data-id="' + data.id + '" data-value="' + data.value + '" ' + (data.groupId > 0 ? 'role="treeitem"' : 'role="option"') + '>';
                            choiceTemplate += data.label;
                            choiceTemplate += '</div>';

                        }

                        return template(choiceTemplate);

                    }
                };

            }
        };
        var settings = XL_LIB.deepExtend({}, defaults, opts);

        return new Select(new Choices(el, settings));
    }

    var dom = XL_LIB.plugins.dom;
    var plugin = {
        init: function () {
            dom.each(dom.find(document, ".select"), function (el, index) {
                
                var isSort = el.getAttribute("allowSort");

                if (isSort != null && isSort === "false") {
                    var arg_element = { shouldSort: false, };
                    selectStore[selectCounter] = createSelect(el, arg_element);
                }
                else {
                    selectStore[selectCounter] = createSelect(el);
                }
                
                el.setAttribute("data-select-number", selectCounter);
                selectCounter += 1;

            });
        },
        create: createSelect,
        getSelect: function (el) {
            var number = el.getAttribute("data-select-number");
            return selectStore[number];
        }
    };

    return plugin;

});

XL_LIB.registerPlugin("datePicker", function () {

    var plugin = {
        init: function () {

            // Select all ".select" element
            var elements = document.querySelectorAll('.date-picker__field');
            Array.prototype.forEach.call(elements, function (el, i) {

                new Pikaday({
                    field: el,
                    format: 'D/MM/YYYY',
                    toString: function (date, format) {
                        // you should do formatting based on the passed format,
                        // but we will just return 'D/M/YYYY' for simplicity
                        var day = date.getDate();
                        var month = date.getMonth() + 1;
                        var year = date.getFullYear();
                        return day + "/" + month + "/" + year;
                    },
                    parse: function (dateString, format) {
                        // dateString is the result of `toString` method
                        var parts = dateString.split('/');
                        var day = parseInt(parts[0], 10);
                        var month = parseInt(parts[1] - 1, 10);
                        var year = parseInt(parts[1], 10);
                        return new Date(year, month, day);
                    }
                });

            });
        }
    };

    return plugin;

});

XL_LIB.registerPlugin("tabbed", function () {

    var dom = XL_LIB.plugins.dom;
    var plugin = {
        init: function () {

            var elements = document.querySelectorAll('.tabbed');

            dom.each(elements, function (el, index) {
                console.log(el);
                createTabbed(el);
            });

            function createTabbed(tabbedEl) {

                var tabbed = {
                    tabs: tabbedEl.querySelectorAll('.tabbed__tab'),
                    anchors: tabbedEl.querySelectorAll('.tabbed__tabs a'),
                    contents: tabbedEl.querySelectorAll('.tabbed__content'),
                    setActive: function (id) {
                        var activeContent = document.getElementById(id);
                        var activeTab = dom.filterOne(this.tabs, function (el, index) {
                            var anchor = dom.findOne(el, "a");
                            return anchor.getAttribute("href") === "#" + id;
                        });
                        var otherContent;
                        var otherTabs;

                        if (activeTab) {
                            otherTabs = dom.filter(this.tabs, function (el, index) { return el !== activeTab; });
                            activeTab.classList.add("active");
                        }
                        if (otherTabs && otherTabs.length > 0) {
                            dom.each(otherTabs, function (el, index) {
                                el.classList.remove("active");
                            });
                        }

                        if (activeContent) {
                            otherContent = dom.getSiblings(activeContent);
                            activeContent.classList.add("active");
                        }
                        if (otherContent && otherContent.length > 0) {
                            dom.each(otherContent, function (el, index) {
                                el.classList.remove("active");
                            });
                        }

                    }
                };

                var initialActiveContents = tabbedEl.querySelectorAll('.tabbed__content.active');
                var collapseControl = tabbedEl.querySelectorAll('.tabbed__collapse-control');

                // Add event listeners to anchors
                dom.each(tabbed.anchors, function (el, index) {
                    el.addEventListener("click", function (event) {

                        event.preventDefault();

                        var href = this.getAttribute("href");
                        var contentID = href.replace("#", "");

                        tabbed.setActive(contentID);

                    });
                });

                if (collapseControl.length > 0) {
                    collapseControl[0].addEventListener("click", function (event) {

                        event.preventDefault();

                        if (tabbedEl.classList.contains("tabbed--collapsed")) {
                            tabbedEl.classList.remove("tabbed--collapsed");
                        }
                        else {
                            tabbedEl.classList.add("tabbed--collapsed");
                        }


                    });
                }

                if (initialActiveContents.length === 0 && tabbed.contents.length > 0) {
                    tabbed.setActive(tabbed.contents[0].getAttribute("id"));
                }

                return tabbed;

            }
  },
        setActive: function (controlId, activeTabId) {            
            var tabsSet = document.querySelectorAll('#' + controlId + ' .tabbed__tab');            

            var activeContentSet = document.getElementById(activeTabId);
            var activeTabSet = dom.filterOne(tabsSet, function (el, index) {
                var anchor = dom.findOne(el, "a");
                return anchor.getAttribute("href") === "#" + activeTabId;
            });
            var otherContentSet;
            var otherTabsSet;

            if (activeTabSet) {
                otherTabsSet = dom.filter(tabsSet, function (el, index) { return el !== activeTabSet; });
                activeTabSet.classList.add("active");
            }
            if (otherTabsSet && otherTabsSet.length > 0) {
                dom.each(otherTabsSet, function (el, index) {
                    el.classList.remove("active");
                });
            }

            if (activeContentSet) {
                otherContentSet = dom.getSiblings(activeContentSet);
                activeContentSet.classList.add("active");
            }
            if (otherContentSet && otherContentSet.length > 0) {
                dom.each(otherContentSet, function (el, index) {
                    el.classList.remove("active");
                });
            }
        }
    };

    return plugin;

});

XL_LIB.registerPlugin("tableScroller", function () {

    var Scroller = function (table) {

        var that = this;

        this.table = table;
        this.scroller = table.querySelector(".table-scroller__scroller");

        this.prevArrow = document.createElement("button");
        this.prevArrow.setAttribute("type", "button");
        this.prevArrow.classList.add("table-scroller__prev-arrow");

        this.nextArrow = document.createElement("button");
        this.nextArrow.setAttribute("type", "button");
        this.nextArrow.classList.add("table-scroller__next-arrow");

        //this.table.appendChild(this.nextArrow);
        //this.table.appendChild(this.prevArrow);

        this.scrollPos = function () {
            return this.scroller.scrollLeft;
        };

        this.disableArrow = function (arrow) {
            var elem = that[arrow + 'Arrow'];
            var className = "table-scroller__" + arrow + "-arrow--disabled";
            if (!elem.classList.contains(className)) {
                elem.classList.add(className);
                elem.setAttribute("disabled", "disabled");
            }
        };

        this.enableArrow = function (arrow) {
            var elem = that[arrow + 'Arrow'];
            var className = "table-scroller__" + arrow + "-arrow--disabled";
            if (elem.classList.contains(className)) {
                elem.classList.remove(className);
                elem.removeAttribute("disabled");
            }
        };

        this.maxScroll = function () {
            return that.scroller.scrollWidth - that.scroller.clientWidth;
        };

        this.updateArrows = function () {
            var pos = that.scrollPos();
            if (this.canScrollBack()) {
                that.enableArrow("prev");
            }
            else {
                that.disableArrow("prev");
            }
            if (this.canScrollForwards()) {
                that.enableArrow("next");
            }
            else {
                that.disableArrow("next");
            }
        };

        this.canScrollBack = function () {
            var pos = that.scrollPos();
            if (pos <= 0) {
                return false;
            }
            else {
                return true;
            }
        };

        this.canScrollForwards = function () {
            var pos = that.scrollPos();
            if (pos >= that.maxScroll()) {
                return false;
            }
            else {
                return true;
            }
        };

        this.goBack = function () {
            var scrollAmount = 100;
            var amountLeftToScroll;
            if (this.canScrollBack()) {
                amountLeftToScroll = this.scrollPos();
                if (amountLeftToScroll < (scrollAmount * 2)) {
                    scrollAmount = amountLeftToScroll;
                }
                that.scroller.scrollLeft -= scrollAmount;
            }
        };

        this.goForwards = function () {
            var scrollAmount = 100;
            var amountLeftToScroll;
            if (this.canScrollForwards()) {
                amountLeftToScroll = this.maxScroll - this.scrollPos();
                if (amountLeftToScroll < (scrollAmount * 2)) {
                    scrollAmount = amountLeftToScroll;
                }
                that.scroller.scrollLeft += scrollAmount;
            }
        };

        this.scroller.addEventListener("scroll", function (e) {
            that.updateArrows();
        });

        this.prevArrow.addEventListener("click", function (e) {
            that.goBack();
        });

        this.nextArrow.addEventListener("click", function (e) {
            that.goForwards();
        });


        this.updateArrows();


    };

    var dom = XL_LIB.plugins.dom;
    var plugin = {
        init: function () {

            var elements = document.querySelectorAll('.table-scroller');
            var scrollers = [];
            var resizeTimeout;

            dom.each(elements, function (el, index) {
                scrollers.push(new Scroller(el));
            });

            window.addEventListener("resize", resizeThrottler, false);

            function resizeThrottler() {

                if (!resizeTimeout) {
                    resizeTimeout = setTimeout(function () {
                        resizeTimeout = null;
                        actualResizeHandler();
                    }, 66);
                }
            }

            function actualResizeHandler() {
                var i = 0;
                for (i = 0; i < scrollers.length; i++) {
                    scrollers[i].updateArrows();
                }
            }


        }
    };

    return plugin;

});

XL_LIB.registerPlugin("fileDrop", function () {

    function addDragClass(el) {
        el.classList.add("file-drag-over");
    }

    function removeDragClass(el) {
        el.classList.remove("file-drag-over");
    }

    var plugin = function (el) {

        el.addEventListener("drop", function (e) {
            e.preventDefault();
            removeDragClass(el);
            console.log(e);

        });
        el.addEventListener("dragover", function (e) {
            e.preventDefault();
            console.log("dragover")
        });
        el.addEventListener("dragenter", function (e) {
            e.preventDefault();
            console.log("dragenter")
            addDragClass(el);
        });
        el.addEventListener("dragleave", function (e) {
            e.preventDefault();
            console.log("dragleave")
            removeDragClass(el);
        });

    };

    return plugin;

});

XL_LIB.registerPlugin("lightbox", function () {



    var plugin = {
        init: function () {

            var that = this;

            this.outerContainer = document.createElement("div");
            this.outerContainer.classList.add("lightbox");

            this.innerContainer = document.createElement("div");
            this.innerContainer.classList.add("lightbox__inner");

            this.content = document.createElement("div");
            this.content.classList.add("lightbox__content");

            //added for fixing script errors
            if (document.body) {
                document.body.appendChild(this.outerContainer);
            }


            
            this.outerContainer.appendChild(this.innerContainer);
            this.innerContainer.appendChild(this.content);

            this.outerContainer.style.display = "none";

            this.outerContainer.addEventListener("click", function (e) {
                if (
                    e.target === that.outerContainer ||
                    e.target === that.innerContainer
                ) {
                    that.hide();
                }
            });

        },
        _show: function () {
            document.body.classList.add("lightbox-open");
            this.outerContainer.style.display = "flex";
        },
        _hide: function () {
            document.body.classList.remove("lightbox-open");
            this.outerContainer.style.display = "none";
        },
        hide: function () {
            this._hide();
        },
        show: function (element, opts) {

            var css = "";
            var key;
            if (opts && opts.style) {
                for (key in opts.style) {
                    css += (css ? ";" : "") + key + ":" + opts.style[key];
                }
            }
            this.content.setAttribute("style", css);
            this.content.appendChild(element);
            this._show();

        }
    };

    return plugin;

});

XL_LIB.registerPlugin("listingTable", function () {

    var plugin = {
        init: function () {

            // Select all ".select" element
            var elements = document.querySelectorAll('.listing-table--clickable-rows tr');
            Array.prototype.forEach.call(elements, function (el, i) {

                el.addEventListener("click", function (e) {

                    var parent;
                    var href;
                    if (e.target.tagName.toLowerCase() !== "td") {
                        return false;
                    }

                    parent = e.target.parentNode;
                    if (parent.classList.contains("listing-table__disabled-row")) {
                        return false;
                    }

                    href = el.getAttribute("data-href");
                    if (href !== null) {
                        window.location = href;
                    }

                });

            });
        }
    };

    return plugin;

});

XL_LIB.registerPlugin("loadingOverlay", function () {

    var plugin = {
        init: function () {
            var opts = {
                lines: 13 // The number of lines to draw
                , length: 10 // The length of each line
                , width: 7 // The line thickness
                , radius: 25 // The radius of the inner circle
                , scale: 1 // Scales overall size of the spinner
                , corners: 1 // Corner roundness (0..1)
                , color: '#FFF' // #rgb or #rrggbb or array of colors
                , opacity: 0.25 // Opacity of the lines
                , rotate: 0 // The rotation offset
                , direction: 1 // 1: clockwise, -1: counterclockwise
                , speed: 1 // Rounds per second
                , trail: 60 // Afterglow percentage
                , fps: 20 // Frames per second when using setTimeout() as a fallback for CSS
                , zIndex: 2e9 // The z-index (defaults to 2000000000)
                , className: 'spinner' // The CSS class to assign to the spinner
                , top: '50%' // Top position relative to parent
                , left: '50%' // Left position relative to parent
                , shadow: false // Whether to render a shadow
                , hwaccel: false // Whether to use hardware acceleration
                , position: 'absolute' // Element positioning
            };

            this.container = document.createElement('div');
            this.container.classList.add("loading-overlay");

            //added for fixing script errors
            if (document.body) {
                document.body.appendChild(this.container);
            }
            this.spinner = new Spinner(opts).spin(this.container);
            this.hide();
        },
        show: function () {
            this.container.style.display = "block";
        },
        hide: function () {
            this.container.style.display = "none";
        }
    };

    return plugin;

});




/*XL_LIB.registerPlugin("select", function(){

	function updateLabel(menu, label) {
		var selectedOption = menu.options[menu.selectedIndex];
		var selectedOptionText = selectedOption.text;
		label.textContent = selectedOptionText;
	}

	var plugin = {
		init: function(){
			// Select all ".select" element
			var elements = document.querySelectorAll('.select');
			Array.prototype.forEach.call(elements, function(el, i){

				// Select the label and menu elements within the ".select" container
				var label = el.querySelectorAll(".select__label")[0];
				var menu = el.querySelectorAll(".select__menu")[0];
				
				menu.onchange = function(event){
					// On select change, update the label
					updateLabel(menu, label)
				};

				// Make sure the correct option is shown in the label at the beginning
				updateLabel(menu, label);

			});		
			
		}
	};
	
	return plugin;

});
*/

