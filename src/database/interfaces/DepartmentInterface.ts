export default interface DepartmentInterface {
  departmentId?: string;
  departmentName: string;
  departmentAlias: string;
  departmentIndex?: number;

  createdAt: Date;
  createdBy: string;
  updatedAt?: Date;
  updatedBy?: string;
}

