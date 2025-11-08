export default interface CompanyGroupInterface {
  groupId?: string;
  groupName: string;

  createdAt: Date;
  createdBy: string;
  updatedAt?: Date;
  updatedBy?: string;
}

