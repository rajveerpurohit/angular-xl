interface DateConstructor {
    addDays: (date: Date, days: number) => Date;
    addYears: (date: Date, years: number) => Date;
}

Date.addDays = function (date: Date, days: number) {
    let temp = new Date(JSON.parse(JSON.stringify(date)));
    temp.setDate(temp.getDate() + days);
    return temp;
};

Date.addYears = function (date: Date, years: number) {
    let temp = new Date(JSON.parse(JSON.stringify(date)));
    temp.setFullYear(temp.getFullYear() + years);
    return temp;
};