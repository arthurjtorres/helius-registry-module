import { DocumentTypeEnum } from "../models/enums/DocumentTypeEnum";

export default interface DocumentInterface {
  documentId?: string;
  documentType: DocumentTypeEnum;
  documentNumber: string;
  documentPhoto?: Blob;
  orgEmitter?: string;
  uf?: string;
  issueDate?: Date;
  validationDate?: Date;
  motherName?: string;
  fatherName?: string;
  fkPersonId: string;

  createdAt: Date;
  createdBy: string;
  updatedAt?: Date;
  updatedBy?: string;
  activated?: boolean;
}

