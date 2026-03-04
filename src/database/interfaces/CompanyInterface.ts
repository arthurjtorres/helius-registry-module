export default interface CompanyInterface {
  companyId?: string;
  companyName: string;
  companyCode?: string;
  companyAcronym: string;
  fkCorporationId: string;
  fkCompanyGroupId: string;

  createdAt: Date;
  createdBy: string;
  updatedAt?: Date;
  updatedBy?: string;
  activated?: boolean;
}

