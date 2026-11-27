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

/** `AAAA-MM-DD` de uma data que existe (o `joi.date()` aceitaria 31 de fevereiro). */
const dateOnly = joi.string().custom((v: string, helpers) =>
  /^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(Date.parse(v)) && new Date(v).toISOString().startsWith(v) ? v : helpers.error("any.invalid"));

const EmployeeValidation = Validation.EmployeeValidation.fork(
  Object.keys(Validation.EmployeeValidation.describe().keys),
  (schema) => schema.optional()
).keys({
  updatedAt: joi.date().required(),
  updatedBy: joi.string().required(),
  activated: joi.forbidden(),
  // dados da pessoa, editados pela tela do funcionário (T27); nome e sobrenome, como na importação
  fullName: joi.string().trim().pattern(/\S+\s+\S+/),
  birthDate: dateOnly,
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