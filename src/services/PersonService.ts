import { ModelStatic, Op } from "sequelize";
import Response from "../utils/Response";
import { EmployeeModel } from "../database/models";

import CreateValidationSchema from "./validations/CreateValidationSchema";
import UpdateValidationSchema from "./validations/UpdateValidationSchema";

import { DocumentModel, PersonModel } from "../database/models";
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

  async updatePerson(id: string, data: Partial<PersonInterface>) {

    if (!id) return Response.badRequest("ID da pessoa não Informado!");
    data.updatedAt = new Date();

    const { error } = UpdateValidationSchema.PersonValidation.validate(data);
    if (error) return Response.badRequest(error.message);

    const [updated] = await this.model.update(data, {
      where: { personId: id, activated: true },
    });

    if (!updated) return Response.notFound("Pessoa não encontrada!");

    const result = await this.model.findOne({ where: { personId: id, activated: true } });
    return Response.ok("Pessoa atualizada com sucesso!", result);
  }

  /**
   * Desativa o registro (exclusão lógica): `activated = false`.
   * @param id Identificador do registro.
   * @param updatedBy Usuário autenticado que executa a operação.
   */
  async deletePerson(id: string, updatedBy: string) {
    if (!id) return Response.badRequest("ID não informado");

    if (await DocumentModel.count({ where: { fkPersonId: id, activated: true } }) > 0) {
      return Response.conflict("Não é possível desativar: a pessoa possui documentos ativos.");
    }
    if (await EmployeeModel.count({ where: { fkPersonId: id, activated: true } }) > 0) {
      return Response.conflict("Não é possível desativar: a pessoa possui funcionários ativos.");
    }

    const [updated] = await this.model.update(
      { activated: false, updatedBy, updatedAt: new Date() },
      { where: { personId: id, activated: true } }
    );
    if (!updated) return Response.notFound("Pessoa não encontrada!");

    return Response.ok("Pessoa desativada com sucesso!");
  }

  /**
   * Reativa um registro desativado (`activated = true`).
   * @param id Identificador do registro.
   * @param updatedBy Usuário autenticado que executa a operação.
   */
  async reactivatePerson(id: string, updatedBy: string) {
    if (!id) return Response.badRequest("ID não informado");

    const [updated] = await this.model.update(
      { activated: true, updatedBy, updatedAt: new Date() },
      { where: { personId: id, activated: false } }
    );
    if (!updated) return Response.notFound("Pessoa não encontrada ou já ativa!");

    return Response.ok("Pessoa reativada com sucesso!");
  }

  async getPerson(id: string) {
    if (!id) return Response.badRequest("ID da pessoa não informado.");

    const result = await this.model.findOne({
      where: { personId: id, activated: true },
      include: [
        { model: DocumentModel, as: 'Document', where: { activated: true }, required: false }
      ]
    });
    if (!result) return Response.notFound("Pessoa não encontrada!");
    return Response.ok("Pessoa encontrada!", result);
  }

  async findPersons(query: Partial<PersonInterface>) {
    const where: any = { activated: true };

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
