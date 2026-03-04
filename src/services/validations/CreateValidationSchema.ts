import joi from "joi";

const CompanyGroupValidation = joi.object({
  groupName: joi.string().min(2).max(100).required(),

  createdAt: joi.date().required(),
  createdBy: joi.string().required(),
  activated: joi.boolean().optional(),
});

const CompanyValidation = joi.object({
  companyName: joi.string().required(),
  companyCode: joi.string().allow(null, ''),
  companyAcronym: joi.string().required(),
  fkCompanyCorporationId: joi.string().uuid().required(),
  fkCompanyGroupId: joi.string().uuid().required(),

  createdAt: joi.date().required(),
  createdBy: joi.string().required(),
  activated: joi.boolean().optional(),
});

const CorporationValidation = joi.object({
  corporationName: joi.string().required(),
  corporationCode: joi.number().optional(),
  corporationAcronym: joi.string().required(),

  createdAt: joi.date().required(),
  createdBy: joi.string().required(),
  activated: joi.boolean().optional(),
});

const DepartmentValidation = joi.object({
  departmentName: joi.string().required(),
  departmentAlias: joi.string().required(),
  departmentIndex: joi.number().integer(),

  createdAt: joi.date().required(),
  createdBy: joi.string().required(),
  activated: joi.boolean().optional(),
});

const SectorValidation = joi.object({
  sectorName: joi.string().required(),
  sectorAlias: joi.string().allow(null, ''),
  sectorIndex: joi.number().integer(),  

  createdAt: joi.date().required(),
  createdBy: joi.string().required(),
  activated: joi.boolean().optional(),
});

const PositionValidation = joi.object({
  positionName: joi.string().required(),
  positionCode: joi.number().integer(), // opcional, normalmente gerado automaticamente

  createdAt: joi.date().required(),
  createdBy: joi.string().required(),
  activated: joi.boolean().optional(),
});

const PersonValidation = joi.object({
  firstName: joi.string().required(),
  lastName: joi.string().required(),
  fullName: joi.string().required(),
  birthDate: joi.date().optional(),

  createdAt: joi.date().required(),
  createdBy: joi.string().required(),
  activated: joi.boolean().optional(),
});

const DocumentValidation = joi.object({
  documentType: joi.string().valid("RG", "CNH", "CPF", "CTPS", "PASSAPORTE").required(),
  documentNumber: joi.string().required(),
  documentPhoto: joi.any().optional(),
  orgEmitter: joi.string().optional(),
  uf: joi.string().length(2).optional(),
  issueDate: joi.date().optional(),
  validationDate: joi.date().optional(),
  motherName: joi.string().optional(),
  fatherName: joi.string().optional(),
  fkDocumentPersonId: joi.string().uuid().required(),

  createdAt: joi.date().required(),
  createdBy: joi.string().required(),
  activated: joi.boolean().optional(),
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
  activated: joi.boolean().optional(),
});

export = {
  CompanyGroupValidation,
  CompanyValidation,
  CorporationValidation,
  DepartmentValidation,
  SectorValidation,
  PositionValidation,
  PersonValidation,
  DocumentValidation,
  EmployeeValidation,
  
};