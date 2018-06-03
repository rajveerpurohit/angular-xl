import { Pipe, PipeTransform } from '@angular/core';
import { DecimalPipe } from '@angular/common';

@Pipe({
    name: 'numericFormat'
})
export class NumericFormatPipe implements PipeTransform {
    transform(value: number): any {
        var abs = Math.abs(value);
        var ret: string;
        var unit = "";
        if (abs >= Math.pow(10, 12)) {
            ret = ((value || 0) / Math.pow(10, 12)).toFixed(1);
            unit = "T";
        }
        else if (abs < Math.pow(10, 12) && abs >= Math.pow(10, 9)) {
            ret = ((value || 0) / Math.pow(10, 9)).toFixed(1).toString();
            unit = "B";
        }
        else if (abs < Math.pow(10, 9) && abs >= Math.pow(10, 6)) {
            ret = ((value || 0) / Math.pow(10, 6)).toFixed(1).toString();
            unit = "M";
        }
        else if (abs < Math.pow(10, 6) && abs >= Math.pow(10, 3)) {
            ret = ((value || 0) / Math.pow(10, 3)).toFixed(1).toString();
            unit = "K";
        }
        else if (abs < Math.pow(10, 3)) {
            ret = Math.round(value).toString();
        }

        if (+ret >= Math.pow(10, 3)) {
            ret = (((+ret) || 0) / Math.pow(10, 3)).toFixed(1).toString();
            if (unit === "") {
                unit = "K";
            }
            else {
                unit = unit.replace("B", "T").replace("M", "B").replace("K", "M");
            }
        }

        var t = ret.split('.');
        if (t[1] === '0') {
            ret = t[0];
        }

        return ret + unit;
    }
}