import { ModelStatic, Op } from "sequelize";
import { parse } from "date-fns";

import Response from "../utils/Response";
import CreateValidationSchema from "./validations/CreateValidationSchema";
import UpdateValidationSchema from "./validations/UpdateValidationSchema";

import { EmployeeModel, PersonModel, CompanyModel, PositionModel, SectorModel, DepartmentModel, DocumentModel } from "../database/models";
import EmployeeInterface from "../database/interfaces/EmployeeInterface";

import PersonService from "./PersonService";
import PositionService from "./PositionService";

class EmployeeService {
  private model: ModelStatic<EmployeeModel> = EmployeeModel;

  async createEmployee(data: EmployeeInterface) {
    data.createdAt = new Date();

    const { error } = CreateValidationSchema.EmployeeValidation.validate(data);
    if (error) return Response.badRequest(error.message);

    await this.model.create({ ...data });
    return Response.created("Funcionário criado com sucesso!");
  }

  async updateEmployee(id: string, data: Partial<EmployeeInterface>) {

    if (!id) return Response.badRequest("ID não informado");
    data.updatedAt = new Date();

    const { error } = UpdateValidationSchema.EmployeeValidation.validate(data);
    if (error) return Response.badRequest(error.message);

    const [updated] = await this.model.update(data, { where: { employeeId: id } });

    if (!updated) return Response.notFound("Funcionário não encontrado!");

    const result = await this.model.findByPk(id, {
      include: [
        { model: PersonModel, as: 'Person' },
        { model: CompanyModel, as: 'Company' },
        { model: PositionModel, as: 'Position' },
        { model: SectorModel, as: 'Sector' },
        { model: DepartmentModel, as: 'Department' }
      ],
    });

    return Response.ok("Funcionário atualizado com sucesso!", result);
  }

  async deleteEmployee(id: string) {
    const deleted = await this.model.destroy({ where: { employeeId: id } });
    if (!deleted) return Response.notFound("Funcionário não encontrado!");
    return Response.ok("Funcionário deletado com sucesso!");
  }

  async getEmployee(id: string) {
    if (!id) return Response.badRequest("ID do funcionário não informado.");

    const result = await this.model.findByPk(id, {
      include: [
        { model: PersonModel, as: 'Person' },
        { model: CompanyModel, as: 'Company' },
        { model: PositionModel, as: 'Position' },
        { model: SectorModel, as: 'Sector' },
        { model: DepartmentModel, as: 'Department' }
      ],
    });

    if (!result) return Response.notFound("Funcionário não encontrado!");
    return Response.ok("Funcionário encontrado!", result);
  }

  async findEmployees(query: Partial<EmployeeInterface>) {
    const where: any = {};

    if (query.registration) {
      where.registration = { [Op.iLike]: `%${query.registration}%` };
    }

    if (query.fkPersonId) {
      where.fkEmployeePersonId = query.fkPersonId;
    }

    const result = await this.model.findAll({
      where,
      include: [
        { model: PersonModel, as: 'Person' },
        { model: CompanyModel, as: 'Company' },
        { model: PositionModel, as: 'Position' },
        { model: SectorModel, as: 'Sector' },
        { model: DepartmentModel, as: 'Department' }
      ],
    });

    if (!result.length) {
      return Response.notFound("Nenhum funcionário encontrado.");
    }

    return Response.ok("Funcionários encontrados com sucesso", result);
  }

  async bulkInsert(payload: {
    companyId: string;
    employees: {
      registration: string;
      fullName: string;
      admissionDate: string;
      position: string;
      birthDate: string;
      cpf?: string;
    }[];
  }, createdBy: string) {

    const { companyId, employees: employeeList } = payload;

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
          createdBy,
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
              createdBy,
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
          createdBy,
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
