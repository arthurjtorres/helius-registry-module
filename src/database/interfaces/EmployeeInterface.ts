export default interface EmployeeInterface {
  employeeId?: string;
  registration: string;
  admissionDate?: Date;
  fkEmployeePersonId: string;
  fkEmployeeCompanyId?: string;
  fkEmployeePositionId?: string;
  fkSectorId?: string;
  fkDepartmentId?: string;

  createdAt: Date;
  createdBy: string;
  updatedAt?: Date;
  updatedBy?: string;
}
