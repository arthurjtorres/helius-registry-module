import db from "./database";
import { setupAssociations } from "./associations";

import CompanyGroupModel from "./CompanyGroupModel";
import CompanyModel from "./CompanyModel";
import CorporationModel from "./CorporationModel";
import DepartmentModel from "./DepartmentModel";
import DocumentModel from "./DocumentModel";
import EmployeeModel from "./EmployeeModel";
import PersonModel from "./PersonModel";
import PositionModel from "./PositionModel";
import SectorModel from "./SectorModel";

setupAssociations();

export default db;

export {
  CompanyGroupModel,
  CompanyModel,
  CorporationModel,
  DepartmentModel,
  DocumentModel,
  EmployeeModel,
  PersonModel,
  PositionModel,
  SectorModel,
}