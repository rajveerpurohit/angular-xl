import { Injectable } from '@angular/core';

@Injectable()
export class UtilityService {

    EncodeToBase64Unicode = (inputString: string): string => {        
        return btoa(encodeURIComponent(inputString).replace(/%([0-9A-F]{2})/g,
            function toSolidBytes(match, p1) {
                return String.fromCharCode(("0x" + p1) as any);
            }));
    }

    DecodeToBase64Unicode = (inputString: string): string => {        
        return decodeURIComponent(atob(inputString).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
    }
}