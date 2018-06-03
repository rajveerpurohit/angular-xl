export class NotificationModel {
    type: NotificationTypeModel;
    message: string;
}

export enum NotificationTypeModel {
    Success,
    Error,
    Info,
    Warning
}