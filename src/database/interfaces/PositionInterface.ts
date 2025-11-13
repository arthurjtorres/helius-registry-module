export default interface PositionInterface {
  positionId?: string;
  positionName: string;
  positionCode?: number;

  createdAt: Date;
  createdBy: string;
  updatedAt?: Date;
  updatedBy?: string;
}

