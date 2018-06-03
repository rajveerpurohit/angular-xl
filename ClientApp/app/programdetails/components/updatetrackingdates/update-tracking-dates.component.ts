import { Component, OnInit, Input, Output, EventEmitter, Injectable } from '@angular/core';
import { Headers, RequestOptions, Http, Response } from '@angular/http';
import { WebApiService } from '../../../common/services/web-api.service';
import { FoolproofControlService } from "../../../common/services/foolproof-control.service";
import { Observable } from "rxjs/Observable";
import * as moment from 'moment';
import { TrackingDates } from '../../../programdetails/models/update-tracking-dates.model';
import { NotificationService } from '../../../notification/notification.service';

@Component({    
    selector: 'rwb-update-tracking-dates',
    templateUrl: './update-tracking-dates.component.html',
    styleUrls: ['./update-tracking-dates.component.less'],
    providers: [FoolproofControlService]
})
@Injectable()
export class UpdateTrackingDatesComponent implements OnInit {
    @Input() readonly: boolean;
    @Input() visible: boolean;
    @Input() programSelectedVersion: any;
    @Input() contractCurrentTrackingDates: any = [];
    @Output() onUpdateTrackingDateClosedEvent = new EventEmitter<boolean>();
    @Output() onUpdateTrackingDateEvent = new EventEmitter<TrackingDates>();

    targetQuoteDateTrackingMessage: string;
    quoteDateTrackingMessage: string;
    fotReceivedDateTrackingMessage: string;
    message: string = '';



    inputDate: Date = new Date();

    constructor(private _webapi: WebApiService, private _fp: FoolproofControlService, private _notify: NotificationService) {

    }

    ngOnInit() { 
        this.targetQuoteDateTrackingMessage = this.quoteDateTrackingMessage = this.fotReceivedDateTrackingMessage = this.message = '';
    }

    dateChanged = (date, status): void => {
        this._notify.clear();
        this.contractCurrentTrackingDates.filter(task => task.key === status).key === status;
        this.contractCurrentTrackingDates.filter(task => task.key === status).value === date;
        console.log("contractCurrentTrackingDates1", this.contractCurrentTrackingDates);
        
        //var trackingdate = new TrackingDates();
        //trackingdate.trackingDateType = status;
        //trackingdate.trackingDateValue = date;

        switch (status) {
            case "Received":
                this.programSelectedVersion.entry.receivedDate = date;
                break;
            case "Target Quote":
                this.programSelectedVersion.entry.targetQuoteDate = date;
                break;
            case "Quote":
                this.programSelectedVersion.entry.quoteDate = date;
                break;
            case "FOT Received":
                this.programSelectedVersion.entry.fotReceivedDate = date;
                break;
            case "Target Authorised":
                this.programSelectedVersion.entry.targetAuthorizedDate = date;
                break;
            case "Authorised":
                this.programSelectedVersion.entry.authorizedDate = date;
                break;
            case "Bound":
                this.programSelectedVersion.entry.boundDate = date;
                break;
            case "NTU":
                this.programSelectedVersion.entry.ntuDate = date;
                break;
            case "Declined":
                this.programSelectedVersion.entry.declinedDate = date;
                break;
            default:
        }

        this.targetQuoteDateTrackingMessage = this.quoteDateTrackingMessage = this.fotReceivedDateTrackingMessage = '';

        if (this.ValidateGivenInputDateOneIsGreater(this.programSelectedVersion.entry.receivedDate, this.programSelectedVersion.entry.targetQuoteDate)) {
            this.targetQuoteDateTrackingMessage = "The Target Quote Date must occur on or after the Received Date.";
        }

        if (this.ValidateGivenInputDateOneIsGreater(this.programSelectedVersion.entry.targetQuoteDate, this.programSelectedVersion.entry.quoteDate)) {
            this.quoteDateTrackingMessage = "The Quote Date must occur on or after the Target Quote Date.";
        }

        if (this.ValidateGivenInputDateOneIsGreater(this.programSelectedVersion.entry.quoteDate, this.programSelectedVersion.entry.fotReceivedDate)) {
            this.fotReceivedDateTrackingMessage = "The FOT Received Date must occur on or after the Quote Date.";
        }
        if (this.isValidTrackingDate) {
            let url = '/api/Program/UpdateTrackingDates';

            this._webapi.post(url, this.programSelectedVersion.entry)
                .map(resp => resp.json()).subscribe(
                (data) => {
                    this.onUpdateTrackingDateEvent.emit(this.programSelectedVersion.entry);
                    //this.onClose();
                },
                (error) => {
                    this._notify.error(error);
                });
        }        

        //this.onUpdateTrackingDateEvent.emit(trackingdate);
    }
    
    get isValidTrackingDate(): boolean {
        if (this.targetQuoteDateTrackingMessage
            || this.quoteDateTrackingMessage
            || this.fotReceivedDateTrackingMessage) {
            this._notify.warn(this.targetQuoteDateTrackingMessage != "" ? this.targetQuoteDateTrackingMessage : ""
                                + this.quoteDateTrackingMessage != "" ? this.quoteDateTrackingMessage : ""
                                + this.fotReceivedDateTrackingMessage != "" ? this.fotReceivedDateTrackingMessage : "");
            //return false;
        }
        return true;
    }

    ValidateGivenInputDateOneIsGreater = (inputDateStringOne: string, inputDateStringTwo: string): boolean => {
        //if given input dates a 'undefined'/ null then ignore validation
        if (typeof inputDateStringOne === 'undefined' || inputDateStringOne === null)
            return false;

        if (typeof inputDateStringTwo === 'undefined' || inputDateStringTwo === null)
            return false;

        let inputDateOne: Date = new Date(inputDateStringOne);
        let inputDateTwo: Date = new Date(inputDateStringTwo);
        return (inputDateOne >= inputDateTwo) 
    }

    onClose() {
        this.visible = false;
        this.onUpdateTrackingDateClosedEvent.emit(this.visible);
    }
}

//import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
//import { trigger, state, style, animate, transition } from '@angular/animations';
//import { WebApiService } from '../../common/services/web-api.service';

//@Component({
//    selector: 'rwb-update-tracking-dates',
//    templateUrl: './update-tracking-dates.component.html',
//    styleUrls: ['./update-tracking-dates.component.less'],
//    animations: [
//        trigger('dialog', [
//            transition('void => *', [
//                style({ transform: 'scale3d(.3, .3, .3)' }),
//                animate(100)
//            ]),
//            transition('* => void', [
//                animate(100, style({ transform: 'scale3d(.0, .0, .0)' }))
//            ])
//        ])
//    ]
//})
//export class UpdateTrackingDatesComponent implements OnInit {
//    @Input() visible: boolean;
//    @Input() programCurrentVersion: any;
//    @Output() onUpdateTrackingDateClosedEvent = new EventEmitter<boolean>();
//    @Output() onUpdateTrackingDateEvent = new EventEmitter<any>();

//    receivedDateMessage: string;
//    targetQuoteDateMessage: string;
//    quoteDateMessage: string;
//    fotReceivedDateMessage: string;
//    targetAuthorizedDateMessage: string;
//    targetQuoteDateTrackingMessage: string;
//    quoteDateTrackingMessage: string;
//    fotReceivedDateTrackingMessage: string;
//    message: string = '';
//    inValidDateMsg: string = 'Please enter a valid date';

//    constructor(private _webapi: WebApiService) {
//    }

//    ngOnInit() {
//        this.receivedDateMessage = this.targetQuoteDateMessage = this.quoteDateMessage = this.fotReceivedDateMessage = this.targetAuthorizedDateMessage = this.targetQuoteDateTrackingMessage = this.quoteDateTrackingMessage = this.fotReceivedDateTrackingMessage = this.message = '';
//    }

//    onUpdateTrackingDates = (): void => {
//        if (this.isValid) {
//            this.targetQuoteDateTrackingMessage = this.quoteDateTrackingMessage = this.fotReceivedDateTrackingMessage = '';

//            if (this.ValidateGivenInputDateOneIsGreater(this.programCurrentVersion.receivedDate, this.programCurrentVersion.targetQuoteDate)) {
//                this.targetQuoteDateTrackingMessage = "The Target Quote Date must occur on or after the Received Date.";
//            }

//            if (this.ValidateGivenInputDateOneIsGreater(this.programCurrentVersion.targetQuoteDate, this.programCurrentVersion.quoteDate)) {
//                this.quoteDateTrackingMessage = "The Quote Date must occur on or after the Target Quote Date.";
//            }

//            if (this.ValidateGivenInputDateOneIsGreater(this.programCurrentVersion.quoteDate, this.programCurrentVersion.fotReceivedDate)) {
//                this.fotReceivedDateTrackingMessage = "The FOT Received Date must occur on or after the Quote Date.";
//            }
//            if (this.isValidTrackingDate) {
//                let url = '/api/Program/UpdateTrackingDates';

//                this._webapi.post(url, this.programCurrentVersion)
//                    .map(resp => resp.json()).subscribe(
//                    (data) => {
//                        this.onUpdateTrackingDateEvent.emit(this.programCurrentVersion);
//                        this.onClose();
//                    },
//                    (error) => {
//                        this.message = error;
//                    });
//            }
//        }
//    }

//    trackingDateSChanged(inputDate: any, dateType: string): void {
//        this.targetQuoteDateTrackingMessage = this.quoteDateTrackingMessage = this.fotReceivedDateTrackingMessage = '';
//        if ((typeof inputDate !== 'undefined' && inputDate !== null)) {            
//            let dateValue = JSON.parse(JSON.stringify(new Date(inputDate)));

//            switch (dateType) {
//                case "receivedDate":
//                    this.receivedDateMessage = '';
//                    if (this.IsDate(dateValue))
//                        this.programCurrentVersion.receivedDate = inputDate;
//                    else
//                        this.receivedDateMessage = this.inValidDateMsg;
//                    break;
//                case "targetQuoteDate":
//                    this.targetQuoteDateMessage = '';
//                    if (this.IsDate(dateValue))
//                        this.programCurrentVersion.targetQuoteDate = inputDate;
//                    else
//                        this.targetQuoteDateMessage = this.inValidDateMsg;
//                    break;
//                case "quoteDate":
//                    this.quoteDateMessage = '';
//                    if (this.IsDate(dateValue))
//                        this.programCurrentVersion.quoteDate = inputDate;
//                    else
//                        this.quoteDateMessage = this.inValidDateMsg;
//                    break;
//                case "FOTReceivedDate":
//                    this.fotReceivedDateMessage = '';
//                    if (this.IsDate(dateValue))
//                        this.programCurrentVersion.fotReceivedDate = inputDate;
//                    else
//                        this.fotReceivedDateMessage = this.inValidDateMsg;
//                    break;
//                case "targetAuthorizedDate":
//                    this.targetAuthorizedDateMessage = '';
//                    if (this.IsDate(dateValue))
//                        this.programCurrentVersion.targetAuthorizedDate = inputDate;
//                    else
//                        this.targetAuthorizedDateMessage = this.inValidDateMsg;
//                    break;
//                default:
//            }            
//        }
//    }

//    ValidateTrackingDatesOnBlur = (inputDate: string, modelValue: any, modelMessage: any): void => {
//        if (this.IsDate(inputDate))
//            modelValue = inputDate;
//        else
//            modelMessage = this.inValidDateMsg;
//    }

//    ValidateGivenInputDateOneIsGreater = (inputDateStringOne: string, inputDateStringTwo: string): boolean => {
//        //if given input dates a 'undefined'/ null then ignore validation
//        if (typeof inputDateStringOne === 'undefined' || inputDateStringOne === null)
//            return false;

//        if (typeof inputDateStringTwo === 'undefined' || inputDateStringTwo === null)
//            return false;

//        let inputDateOne: Date = new Date(inputDateStringOne);
//        let inputDateTwo: Date = new Date(inputDateStringTwo);
//        return (inputDateOne >= inputDateTwo) 
//    }

//    IsDate(inputDate: string): boolean {        
//        return ((typeof inputDate !== 'undefined') && (inputDate !== null) && this.isValidDate(inputDate))
//    }

//    get isValid(): boolean {
//        if (this.receivedDateMessage
//            || this.targetQuoteDateMessage
//            || this.quoteDateMessage
//            || this.fotReceivedDateMessage
//            || this.targetAuthorizedDateMessage) {
//            return false;
//        }
//        return true;
//    }

//    get isValidTrackingDate(): boolean {
//        if (this.targetQuoteDateTrackingMessage
//            || this.quoteDateTrackingMessage
//            || this.fotReceivedDateTrackingMessage) {
//            return false;
//        }
//        return true;
//    }

//    isValidDate(inputDate: string): boolean {
//        //Date format is 2018-03-28T04:00:00.000Z
//        var dateFormat = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/;

//        if (dateFormat.test(inputDate)) {
//            return true;
//        } else {
//            return false;
//        }
//    }

//    //// Checks a string to see if it in a valid date format
//    //// of (D)D/(M)M/(YY)YY and returns true/false
//    //isValidDate(inputDate: string): boolean {
//    //    // format D(D)/M(M)/(YY)YY
//    //    var dateFormat = /^\d{1,4}[\.|\/|-]\d{1,2}[\.|\/|-]\d{1,4}$/;

//    //    if (dateFormat.test(inputDate)) {
//    //        // remove any leading zeros from date values
//    //        inputDate = inputDate.replace(/0*(\d*)/gi, "$1");
//    //        var dateArray = inputDate.split(/[\.|\/|-]/);

//    //        // correct month value
//    //        dateArray[1] = String(parseInt(dateArray[1]) - 1);

//    //        // correct year value
//    //        if (dateArray[2].length < 4) {
//    //            // correct year value
//    //            dateArray[2] = String((parseInt(dateArray[2]) < 50) ? 2000 + parseInt(dateArray[2]) : 1900 + parseInt(dateArray[2]));
//    //        }

//    //        var testDate = new Date(parseInt(dateArray[2]), parseInt(dateArray[1]), parseInt(dateArray[0]));
//    //        if (testDate.getDate() != parseInt(dateArray[0]) || testDate.getMonth() != parseInt(dateArray[1]) || testDate.getFullYear() != parseInt(dateArray[2])) {
//    //            return false;
//    //        } else {
//    //            return true;
//    //        }
//    //    } else {
//    //        return false;
//    //    }
//    //}

//    onClose() {
//        this.visible = false;
//        this.onUpdateTrackingDateClosedEvent.emit(this.visible);
//    }
//}
