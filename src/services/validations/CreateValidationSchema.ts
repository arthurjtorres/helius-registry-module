import joi from "joi";
import { CameraTypeEnum } from "../../database/models/enums/CameraTypeEnum";
import { LocationTypeEnum } from "../../database/models/enums/LocationTypeEnum";

const BusTimetableValidation = joi.object({
  timetableName: joi.string().required(),
  timetableCode: joi.string().required(),
  kml: joi.string().optional().allow(null, ""),
  startDate: joi.date().optional(),
  endDate: joi.date().optional(),
  fkBusTimetableLocationStartId: joi.string().uuid().required(),
  fkBusTimetableLocationEndId: joi.string().uuid().required(),

  createdAt: joi.date().required(),
  createdBy: joi.string().required(),
}); 

const CompanyGroupValidation = joi.object({
  groupName: joi.string().min(2).max(100).required(),

  createdAt: joi.date().required(),
  createdBy: joi.string().required(),
});

const CompanyValidation = joi.object({
  companyName: joi.string().required(),
  companyCode: joi.string().allow(null, ''),
  companyAcronym: joi.string().required(),
  fkCompanyCorporationId: joi.string().uuid().required(),
  fkCompanyGroupId: joi.string().uuid().required(),

  createdAt: joi.date().required(),
  createdBy: joi.string().required(),
});

const CorporationValidation = joi.object({
  corporationName: joi.string().required(),
  corporationCode: joi.number().optional(),
  corporationAcronym: joi.string().required(),

  createdAt: joi.date().required(),
  createdBy: joi.string().required(),
});

const DepartmentValidation = joi.object({
  departmentName: joi.string().required(),
  departmentAlias: joi.string().required(),
  departmentIndex: joi.number().integer(),

  createdAt: joi.date().required(),
  createdBy: joi.string().required(),
});

const SectorValidation = joi.object({
  sectorName: joi.string().required(),
  sectorAlias: joi.string().allow(null, ''),
  sectorIndex: joi.number().integer(),  

  createdAt: joi.date().required(),
  createdBy: joi.string().required(),
});

const PositionValidation = joi.object({
  positionName: joi.string().required(),
  positionCode: joi.number().integer(), // opcional, normalmente gerado automaticamente

  createdAt: joi.date().required(),
  createdBy: joi.string().required(),
});

const VehicleTypeValidation = joi.object({
  typeVehicleName: joi.string().required(),
  airConditioner: joi.boolean().required(),

  createdAt: joi.date().required(),
  createdBy: joi.string().required(),
});

const VehicleValidation = joi.object({
  vehicleNumber: joi.string().required(),
  licensePlate: joi.string().required(),
  brand: joi.string().required(),
  model: joi.string().required(),
  year: joi.string().required(),
  hasWifi: joi.boolean().required(),
  cameraType: joi.string().valid(...Object.values(CameraTypeEnum)).required(),
  fkVehicleTypeVehicleId: joi.string().uuid().required(),
  fkVehicleCompanyId: joi.string().uuid().required(),

  createdAt: joi.date().required(),
  createdBy: joi.string().required(),
});

const LocationValidation = joi.object({
  locationName: joi.string().required(),
  locationCeturbCode: joi.string().required(),
  locationGlobusCode: joi.string().optional().allow(null, ""),
  locationType: joi.string().valid(...Object.values(LocationTypeEnum)).required(),
  locationAcronym: joi.string().optional().allow(null, ""),

  createdAt: joi.date().required(),
  createdBy: joi.string().required(),
});

const PersonValidation = joi.object({
  firstName: joi.string().required(),
  lastName: joi.string().required(),
  fullName: joi.string().required(),
  birthDate: joi.date().optional(),

  createdAt: joi.date().required(),
  createdBy: joi.string().required(),
});

const DocumentValidation = joi.object({
  documentType: joi.string().valid("RG", "CNH", "CPF", "CTPS", "PASSAPORTE").required(),
  documentNumber: joi.string().required(),
  orgEmitter: joi.string().required(),
  uf: joi.string().length(2).required(),
  issueDate: joi.date().required(),
  motherName: joi.string().required(),
  fatherName: joi.string().optional(),
  fkDocumentPersonId: joi.string().uuid().required(),

  createdAt: joi.date().required(),
  createdBy: joi.string().required(),
});

const EmployeeValidation = joi.object({
  registration: joi.string().required(),
  admissionDate: joi.date().optional(),
  fkEmployeePersonId: joi.string().uuid().required(),
  fkEmployeeCompanyId: joi.string().uuid().optional(),
  fkEmployeePositionId: joi.string().uuid().optional(),
  fkSectorId: joi.string().uuid().optional(),
  fkDepartmentId: joi.string().uuid().optional(),

  createdAt: joi.date().required(),
  createdBy: joi.string().required(),
});

export = {
  BusTimetableValidation,
  CompanyGroupValidation,
  CompanyValidation,
  CorporationValidation,
  DepartmentValidation,
  SectorValidation,
  PositionValidation,
  VehicleTypeValidation,
  VehicleValidation,
  LocationValidation,
  PersonValidation,
  DocumentValidation,
  EmployeeValidation,
  
};