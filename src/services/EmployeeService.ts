import { ModelStatic, Op } from "sequelize";
import { parse } from "date-fns";

import Response from "../utils/Response";
import CreateValidationSchema from "./validations/CreateValidationSchema";
import UpdateValidationSchema from "./validations/UpdateValidationSchema";

import { EmployeeModel, PersonModel, CompanyModel, PositionModel, SectorModel, DepartmentModel, DocumentModel } from "../database/models";
import EmployeeInterface from "../database/interfaces/EmployeeInterface";

import PersonService from "./PersonService";
import PositionService from "./PositionService";
import { hasActiveUserForEmployee, ControlUnavailableError } from "./integrations/UserService";

class EmployeeService {
  private model: ModelStatic<EmployeeModel> = EmployeeModel;

  async createEmployee(data: EmployeeInterface) {
    data.createdAt = new Date();

    const { error } = CreateValidationSchema.EmployeeValidation.validate(data);
    if (error) return Response.badRequest(error.message);

    const existing = await this.model.findOne({ where: { registration: data.registration } });
    if (existing) {
      return Response.conflict(
        existing.activated
          ? "Matrícula já cadastrado(a)."
          : `Matrícula já existe como registro inativo (id: ${existing.employeeId}). Reative-o em PATCH /employee/${existing.employeeId}/reactivate.`
      );
    }

    await this.model.create({ ...data });
    return Response.created("Funcionário criado com sucesso!");
  }

  async updateEmployee(id: string, data: Partial<EmployeeInterface>) {

    if (!id) return Response.badRequest("ID não informado");
    data.updatedAt = new Date();

    const { error } = UpdateValidationSchema.EmployeeValidation.validate(data);
    if (error) return Response.badRequest(error.message);

    const [updated] = await this.model.update(data, { where: { employeeId: id, activated: true } });

    if (!updated) return Response.notFound("Funcionário não encontrado!");

    const result = await this.model.findOne({
      where: { employeeId: id, activated: true },
      include: [
        { model: PersonModel, as: 'Person', where: { activated: true }, required: false },
        { model: CompanyModel, as: 'Company', where: { activated: true }, required: false },
        { model: PositionModel, as: 'Position', where: { activated: true }, required: false },
        { model: SectorModel, as: 'Sector', where: { activated: true }, required: false },
        { model: DepartmentModel, as: 'Department', where: { activated: true }, required: false }
      ],
    });

    return Response.ok("Funcionário atualizado com sucesso!", result);
  }

  /**
   * Desativa o registro (exclusão lógica): `activated = false`.
   * @param id Identificador do registro.
   * @param updatedBy Usuário autenticado que executa a operação.
   * @param authorization Header `Authorization` original, repassado ao `control`.
   * @returns 409 se houver usuário ativo no `control`; 503 se o `control` não puder ser consultado.
   */
  async deleteEmployee(id: string, updatedBy: string, authorization: string) {
    if (!id) return Response.badRequest("ID não informado");

    try {
      if (await hasActiveUserForEmployee(id, authorization)) {
        return Response.conflict("Não é possível desativar: o funcionário possui usuário ativo.");
      }
    } catch (error) {
      if (error instanceof ControlUnavailableError) {
        return Response.unavailable("Não foi possível verificar usuários do funcionário. Tente novamente.");
      }
      throw error;
    }

    const [updated] = await this.model.update(
      { activated: false, updatedBy, updatedAt: new Date() },
      { where: { employeeId: id, activated: true } }
    );
    if (!updated) return Response.notFound("Funcionário não encontrado!");

    return Response.ok("Funcionário desativado com sucesso!");
  }

  /**
   * Reativa um registro desativado (`activated = true`).
   * @param id Identificador do registro.
   * @param updatedBy Usuário autenticado que executa a operação.
   */
  async reactivateEmployee(id: string, updatedBy: string) {
    if (!id) return Response.badRequest("ID não informado");

    const [updated] = await this.model.update(
      { activated: true, updatedBy, updatedAt: new Date() },
      { where: { employeeId: id, activated: false } }
    );
    if (!updated) return Response.notFound("Funcionário não encontrado ou já ativo!");

    return Response.ok("Funcionário reativado com sucesso!");
  }

  async getEmployee(id: string) {
    if (!id) return Response.badRequest("ID do funcionário não informado.");

    const result = await this.model.findOne({
      where: { employeeId: id, activated: true },
      include: [
        { model: PersonModel, as: 'Person', where: { activated: true }, required: false },
        { model: CompanyModel, as: 'Company', where: { activated: true }, required: false },
        { model: PositionModel, as: 'Position', where: { activated: true }, required: false },
        { model: SectorModel, as: 'Sector', where: { activated: true }, required: false },
        { model: DepartmentModel, as: 'Department', where: { activated: true }, required: false }
      ],
    });

    if (!result) return Response.notFound("Funcionário não encontrado!");
    return Response.ok("Funcionário encontrado!", result);
  }

  async findEmployees(query: Partial<EmployeeInterface>) {
    const where: any = { activated: true };

    if (query.registration) {
      where.registration = { [Op.iLike]: `%${query.registration}%` };
    }

    if (query.fkPersonId) {
      where.fkEmployeePersonId = query.fkPersonId;
    }

    const result = await this.model.findAll({
      where,
      include: [
        { model: PersonModel, as: 'Person', where: { activated: true }, required: false },
        { model: CompanyModel, as: 'Company', where: { activated: true }, required: false },
        { model: PositionModel, as: 'Position', where: { activated: true }, required: false },
        { model: SectorModel, as: 'Sector', where: { activated: true }, required: false },
        { model: DepartmentModel, as: 'Department', where: { activated: true }, required: false }
      ],
    });

    if (!result.length) {
      return Response.notFound("Nenhum funcionário encontrado.");
    }

    return Response.ok("Funcionários encontrados com sucesso", result);
  }

  async bulkInsert(payload: {
    companyId: string;
    userId: string;
    employees: {
      registration: string;
      fullName: string;
      admissionDate: string;
      position: string;
      birthDate: string;
      cpf?: string;
    }[];
  }) {

    const { companyId, userId, employees: employeeList } = payload;

    if (!employeeList.length) {
      return Response.badRequest("Lista de funcionários vazia.");
    }

    if (!companyId) {
      return Response.badRequest("Id da empresa não informado.");
    }

    const personService = new PersonService();
    const positionService = new PositionService();
    const createdEmployees = [];

    for (const emp of employeeList) {
      const { fullName, registration, admissionDate, position, birthDate, cpf } = emp;

      // Verifica se funcionário já existe
      const existingEmployee = await this.model.findOne({ where: { registration } });
      if (existingEmployee) {
        console.warn(`Funcionário com matrícula ${registration} já existe. Ignorando.`);
        continue;
      }

      // Divisão do nome
      const nameParts = fullName.trim().split(/\s+/);
      const firstName = nameParts[0];
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

      try {
        const parsedAdmissionDate = parse(admissionDate, "dd/MM/yyyy", new Date());
        const parsedBirthDate = parse(birthDate, "dd/MM/yyyy", new Date());

        const personPayload = {
          fullName,
          firstName,
          lastName,
          birthDate: parsedBirthDate, // assumindo que PersonModel aceita essa propriedade
          activated: true,
          createdBy: userId,
        };

        const personResult = await personService.createPerson(personPayload as any);
        if (personResult.status !== 201 || !('data' in personResult)) {
          console.error(`Erro ao criar pessoa ${fullName}:`, personResult.message);
          continue;

        }

        const personData = personResult.data as { personId: string };
        const fkPersonId = personData.personId;

        if (cpf && cpf.trim() !== "") {
          const cleanCpf = cpf.replace(/\D/g, ''); // Remove pontos e traços
          if (cleanCpf.length === 11) {
            // Importante: Verifique se o DocumentModel está importado no seu arquivo
            await DocumentModel.create({
              documentType: 'CPF',
              documentNumber: cleanCpf,
              fkPersonId: fkPersonId,
              activated: true,
              createdBy: userId,
            }).catch(err => console.error(`Erro ao salvar CPF de ${fullName}:`, err.message));
          }
        }

        // Buscar cargo
        let fkPositionId: string | undefined = undefined;
        const positionResult = await positionService.findPositions({ positionName: position });
        if (positionResult.status === 200 && ('data' in positionResult) && Array.isArray(positionResult.data)) {
          const positionData = positionResult.data[0] as { positionId: string };
          fkPositionId = positionData.positionId;
        } else {
          console.warn(`Cargo '${position}' não encontrado. Continuando sem atribuir posição.`);
        }

        await this.model.create({
          registration,
          fkPersonId,
          admissionDate: parsedAdmissionDate,
          fkPositionId,
          fkCompanyId: companyId,
          activated: true,
          createdBy: userId,
        });

        createdEmployees.push({
          registration,
          fullName,
        });

      } catch (error) {
        console.error(`Erro crítico no registro ${registration}:`, error);
        continue;
      }
    }

    return Response.created("Funcionários inseridos com sucesso!", createdEmployees);
  }
}

export default EmployeeService;
