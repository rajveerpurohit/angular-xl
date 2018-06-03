import { Injectable } from '@angular/core';
import { Http, Response, Headers, ResponseContentType } from '@angular/http';
import 'rxjs/add/operator/map';
import { Observable } from 'rxjs/Observable';
import { InitialDataService } from './initial-data.service';
import { BlockUIService } from './block-ui.service';


@Injectable()
export class WebApiService {
    private headers: Headers;
    private baseUrl: string = this._init.BaseUrl;

    constructor(private http: Http, private _init: InitialDataService, private _blockUI: BlockUIService) {
        this.headers = new Headers();
        this.headers.append('Content-Type', 'application/json');
        this.headers.append('Accept', 'application/json');
        this.headers.append('userId', this._init.UserId);
    }

    public getFinalUrl = (url: string): string => {
        return this.baseUrl + url;
    }

    public post = (url: string, data: any, blockUI: boolean = true): Observable<any> => {
        //url = this.baseUrl + url;
        //if (blockUI) {
        //    this._blockUI.show();
        //}
        //return this.http.post(url, data, { headers: this.headers }).finally(() => {
        //    if (blockUI) {
        //        this._blockUI.hide();
        //    }
        //});

        return this.formPost(url, data, { headers: this.headers });
    }

    public get = (url: string, blockUI: boolean = true): Observable<any> => {
        return this.getWithOptions(url, { headers: this.headers }, blockUI);
    }

    public getWithOptions = (url: string, options: object, blockUI: boolean = true): Observable<any> => {
        url = this.baseUrl + url;
        if (blockUI) {
            this._blockUI.show();
        }
        return this.http.get(url, options).finally(() => {
            if (blockUI) {
                this._blockUI.hide();
            }
        });
    }

    public formPost = (url: string, data: any, options: any, blockUI: boolean = true): Observable<any> => {
        url = this.baseUrl + url;
       
        if (blockUI) {
            this._blockUI.show();
        }
        console.log("UUULLLL",url)
        return this.http.post(url, data, options).finally(() => {
            if (blockUI) {
                this._blockUI.hide();
            }
        });

    }

    public downloadExcel(url: string, fileName: string) {
        //return this.getWithOptions(url, { responseType: ResponseContentType.Blob })
        //    .map(res => res.blob())
        //    .subscribe(
        //        (blob) => {
        //            if (navigator.appVersion.toString().indexOf('.NET') > 0) { // for IE browser
        //                window.navigator.msSaveBlob(blob, fileName);
        //            }
        //            else { // for chrome and firfox
        //                var link = document.createElement('a');
        //                link.href = window.URL.createObjectURL(blob);
        //                link.download = fileName;
        //                link.click();
        //            }
        //        },
        //        error => {
        //        }
        //);

        var observe = this.getWithOptions(url, { responseType: ResponseContentType.Blob });
        this.saveFile(observe, fileName);
    }

    public downloadExcelByPost(url: string, data: any, fileName:string) {
        //return this.formPost(url, data, { responseType: ResponseContentType.Blob }).map(res => res.blob())
        //    .subscribe(
        //        (blob) => {
        //            if (navigator.appVersion.toString().indexOf('.NET') > 0) { // for IE browser
        //                window.navigator.msSaveBlob(blob, fileName);
        //            }
        //            else { // for chrome and firfox
        //                var link = document.createElement('a');
        //                link.href = window.URL.createObjectURL(blob);
        //                link.download = fileName;
        //                link.click();
        //            }
        //        },
        //        error => {
        //        }
        //    );

        var observe = this.formPost(url, data, { responseType: ResponseContentType.Blob });
        this.saveFile(observe, fileName);
    }

    private saveFile(observe: Observable<any>, fileName: string) {

        observe.map(res => res.blob())
            .subscribe(
                (blob) => {
                    if (navigator.appVersion.toString().indexOf('.NET') > 0) { // for IE browser
                        window.navigator.msSaveBlob(blob, fileName);
                    }
                    else { // for chrome and firfox
                        var link = document.createElement('a');
                        link.href = window.URL.createObjectURL(blob);
                        link.download = fileName;
                        link.click();
                    }
                },
                error => {
                }
            );

    }

}