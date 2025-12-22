import { ModelStatic, Op } from "sequelize";
import PersonModel from "../database/models/PersonModel";
import CreateValidationSchema from "./validations/CreateValidationSchema";
import UpdateValidationSchema from "./validations/UpdateValidationSchema";
import Response from "../utils/Response";
import PersonInterface from "../database/interfaces/PersonInterface";

class PersonService {
  private model: ModelStatic<PersonModel> = PersonModel;

  async createPerson(data: PersonInterface) {
    data.createdAt = new Date();
    
    const { error } = CreateValidationSchema.PersonValidation.validate(data);
    if (error) return Response.badRequest(error.message);

    const created = await this.model.create({ ...data });
    return Response.created("Pessoa criada com sucesso!", created);
  }

  async updatePerson(personId: string, data: Partial<PersonInterface>) {
    data.updatedAt = new Date();
    if (!personId) return Response.badRequest("ID da pessoa não Informado!");

    const { error } = UpdateValidationSchema.UpdateValidation.validate(data);
    if (error) return Response.badRequest(error.message);

    const [updated] = await this.model.update(data, {
      where: { personId },
    });

    if (!updated) return Response.notFound("Pessoa não encontrada!");

    const result = await this.model.findByPk(personId);
    return Response.ok("Pessoa atualizada com sucesso!", result);
  }

  async deletePerson(id: string) {
    const deleted = await this.model.destroy({ where: { personId: id } });
    if (!deleted) return Response.notFound("Pessoa não encontrada!");
    return Response.ok("Pessoa deletada com sucesso!");
  }

  async getPerson(id: string) {
    if (!id) return Response.badRequest("ID da pessoa não informado.");

    const result = await this.model.findByPk(id);
    if (!result) return Response.notFound("Pessoa não encontrada!");
    return Response.ok("Pessoa encontrada!", result);
  }

  async findPersons(query: Partial<PersonInterface>) {
    const where: any = {};

    if (query.firstName) {
      where.firstName = { [Op.iLike]: `%${query.firstName}%` };
    }

    if (query.lastName) {
      where.lastName = { [Op.iLike]: `%${query.lastName}%` };
    }

    if (query.fullName) {
      where.fullName = { [Op.iLike]: `%${query.fullName}%` };
    }

    if (query.birthDate) {
      where.birthDate = { [Op.iLike]: `%${query.birthDate}%` };
    }

    const result = await this.model.findAll({ where });

    if (!result.length) {
      return Response.notFound("Nenhuma pessoa encontrada.");
    }

    return Response.ok("Pessoas encontradas com sucesso", result);
  }
}

export default PersonService;
