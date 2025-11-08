export default interface SectorInterface {
  sectorId?: string;
  sectorName: string;
  sectorAlias?: string;
  sectorIndex?: number;

  createdAt: Date;
  createdBy: string;
  updatedAt?: Date;
  updatedBy?: string;
}
