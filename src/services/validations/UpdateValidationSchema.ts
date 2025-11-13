import joi from "joi";

const UpdateValidation = joi.object({
  updatedAt: joi.date().required(),
  updatedBy: joi.string().required(),

}); 

export = {
  UpdateValidation,
}