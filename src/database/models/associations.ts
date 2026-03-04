import CompanyGroupModel from "./CompanyGroupModel";
import CompanyModel from "./CompanyModel";
import CorporationModel from "./CorporationModel";
import DepartmentModel from "./DepartmentModel";
import DocumentModel from "./DocumentModel";
import EmployeeModel from "./EmployeeModel";
import PersonModel from "./PersonModel";
import PositionModel from "./PositionModel";
import SectorModel from "./SectorModel";

export const setupAssociations = () => {

  // CompanyGroup
  CompanyGroupModel.hasMany(CompanyModel, {
    foreignKey: 'fkCompanyGroupId',
    sourceKey: 'groupId',
    as: 'Company'
  });

  // Company
  CompanyModel.belongsTo(CompanyGroupModel, {
    foreignKey: 'fkCompanyGroupId',
    targetKey: 'groupId',
    as: 'CompanyGroup'
  });

  CompanyModel.belongsTo(CorporationModel, {
    foreignKey: 'fkCorporationId',
    targetKey: 'corporationId',
    as: 'Corporation'
  });

  CompanyModel.hasMany(EmployeeModel, {
    foreignKey: 'fkCompanyId',
    sourceKey: 'companyId',
    as: 'Employee'
  });

  // Corporation
  CorporationModel.hasMany(CompanyModel, {
    foreignKey: 'fkCorporationId',
    sourceKey: 'corporationId',
    as: 'Company'
  });

  // Document
  DocumentModel.belongsTo(PersonModel, {
    foreignKey: 'fkPersonId',
    targetKey: 'personId',
    as: 'Person'
  });

  // Person
  PersonModel.hasMany(DocumentModel, {
    foreignKey: 'fkPersonId',
    sourceKey: 'personId',
    as: 'Document'
  });

  PersonModel.hasMany(EmployeeModel, {
    foreignKey: 'fkPersonId',
    sourceKey: 'personId',
    as: 'Employee'
  });

  // Employee
  EmployeeModel.belongsTo(PersonModel, {
    foreignKey: 'fkPersonId',
    targetKey: 'personId',
    as: 'Person'
  });

  EmployeeModel.belongsTo(CompanyModel, {
    foreignKey: 'fkCompanyId',
    targetKey: 'companyId',
    as: 'Company'
  });

  EmployeeModel.belongsTo(PositionModel, {
    foreignKey: 'fkPositionId',
    targetKey: 'positionId',
    as: 'Position'
  });

  EmployeeModel.belongsTo(SectorModel, {
    foreignKey: 'fkSectorId',
    targetKey: 'sectorId',
    as: 'Sector'
  });

  EmployeeModel.belongsTo(DepartmentModel, {
    foreignKey: 'fkDepartmentId',
    targetKey: 'departmentId',
    as: 'Department',
  });

  PositionModel.hasMany(EmployeeModel, {
    foreignKey: 'fkPositionId',
    sourceKey: 'positionId',
    as: 'Employee'
  });

  SectorModel.hasMany(EmployeeModel, {
    foreignKey: 'fkSectorId',
    sourceKey: 'sectorId',
    as: 'Employee'
  });

  DepartmentModel.hasMany(EmployeeModel, {
    foreignKey: 'fkDepartmentId',
    sourceKey: 'departmentId',
    as: 'Employee'
  });

  console.log("✅ Associações configuradas com sucesso.");
};