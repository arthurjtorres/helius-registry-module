export default interface EmployeeInterface {
  employeeId?: string;
  registration: string;
  admissionDate?: Date;
  fkPersonId: string;
  fkCompanyId?: string;
  fkPositionId?: string;
  fkSectorId?: string;
  fkDepartmentId?: string;

  createdAt: Date;
  createdBy: string;
  updatedAt?: Date;
  updatedBy?: string;
  activated?: boolean;
}
