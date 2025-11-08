export default interface CorporationInterface {
  corporationId?: string;
  corporationName: string;
  corporationCode?: string;
  corporationAcronym: string;

  createdAt: Date;
  createdBy: string;
  updatedAt?: Date;
  updatedBy?: string;
}