import joi from "joi";
import Validation from "./CreateValidationSchema";

const CompanyGroupValidation = Validation.CompanyGroupValidation.fork(
  Object.keys(Validation.CompanyGroupValidation.describe().keys),
  (schema) => schema.optional()
).keys({
  updatedAt: joi.date().required(),
  updatedBy: joi.string().required(),
  activated: joi.forbidden(),
});

const CompanyValidation = Validation.CompanyValidation.fork(
  Object.keys(Validation.CompanyValidation.describe().keys),
  (schema) => schema.optional()
).keys({
  updatedAt: joi.date().required(),
  updatedBy: joi.string().required(),
  activated: joi.forbidden(),
});

const CorporationValidation = Validation.CorporationValidation.fork(
  Object.keys(Validation.CorporationValidation.describe().keys),
  (schema) => schema.optional()
).keys({
  updatedAt: joi.date().required(),
  updatedBy: joi.string().required(),
  activated: joi.forbidden(),
});

const DepartmentValidation = Validation.DepartmentValidation.fork(
  Object.keys(Validation.DepartmentValidation.describe().keys),
  (schema) => schema.optional()
).keys({
  updatedAt: joi.date().required(),
  updatedBy: joi.string().required(),
  activated: joi.forbidden(),
});

const SectorValidation = Validation.SectorValidation.fork(
  Object.keys(Validation.SectorValidation.describe().keys),
  (schema) => schema.optional()
).keys({
  updatedAt: joi.date().required(),
  updatedBy: joi.string().required(),
  activated: joi.forbidden(),
});

const PositionValidation = Validation.PositionValidation.fork(
  Object.keys(Validation.PositionValidation.describe().keys),
  (schema) => schema.optional()
).keys({
  updatedAt: joi.date().required(),
  updatedBy: joi.string().required(),
  activated: joi.forbidden(),
});

const PersonValidation = Validation.PersonValidation.fork(
  Object.keys(Validation.PersonValidation.describe().keys),
  (schema) => schema.optional()
).keys({
  updatedAt: joi.date().required(),
  updatedBy: joi.string().required(),
  activated: joi.forbidden(),
});

const DocumentValidation = Validation.DocumentValidation.fork(
  Object.keys(Validation.DocumentValidation.describe().keys),
  (schema) => schema.optional()
).keys({
  updatedAt: joi.date().required(),
  updatedBy: joi.string().required(),
  activated: joi.forbidden(),
});

const EmployeeValidation = Validation.EmployeeValidation.fork(
  Object.keys(Validation.EmployeeValidation.describe().keys),
  (schema) => schema.optional()
).keys({
  updatedAt: joi.date().required(),
  updatedBy: joi.string().required(),
  activated: joi.forbidden(),
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
}