export class UpdateDocumentModel {
    public programNum: string;
    public documentID: string;
    public documentGuid: string;
    public typeId: string;
    public typeDescription: string;
    public subTypeId: string;
    public subTypeDescription: string;
    public xLeRate: string;
    public ownerType: string;
    public description: string;
    public isrowselected: boolean;

    constructor(programNum: string, documentGuid: string, documentID: string, typeId: string, typeDescription: string, subTypeId: string, subTypeDescription: string, xLeRate: string, ownerType: string, description: string) {
        this.programNum = programNum;
        this.documentGuid = documentGuid;
        this.documentID = documentID;
        this.typeId = typeId;
        this.typeDescription = typeDescription;
        this.subTypeId = subTypeId;
        this.subTypeDescription = subTypeDescription;
        this.xLeRate = xLeRate;
        this.ownerType = ownerType;
        this.description = description;
        this.isrowselected = false;

    }
}