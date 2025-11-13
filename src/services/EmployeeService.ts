import { ModelStatic, Op } from "sequelize";
import { parse } from "date-fns";
import { v4 as uuidv4 } from "uuid";
import EmployeeModel from "../database/models/EmployeeModel";
import PersonModel from "../database/models/PersonModel";
import CreateValidationSchema from "./validations/CreateValidationSchema";
import UpdateValidationSchema from "./validations/UpdateValidationSchema";
import Response from "../utils/Response";
import EmployeeInterface from "../database/interfaces/EmployeeInterface";
import PersonService from "./PersonService";
import CompanyModel from "../database/models/CompanyModel";
import PositionModel from "../database/models/PositionModel";
import PositionService from "./PositionService";
import SectorModel from "../database/models/SectorModel";
import DepartmentModel from "../database/models/DepartmentModel";

class EmployeeService {
  private model: ModelStatic<EmployeeModel> = EmployeeModel;

  async createEmployee(data: EmployeeInterface) {        
    data.createdAt = new Date();
    const { error } = CreateValidationSchema.EmployeeValidation.validate(data);
    if (error) return Response.badRequest(error.message);

    await this.model.create({ ...data });
    return Response.created("Funcionário criado com sucesso!");
  }

  async updateEmployee(employeeId: string, data: Partial<EmployeeInterface>) {
    data.updatedAt = new Date();
    if (!employeeId) return Response.badRequest("ID não informado");

    const { error } = UpdateValidationSchema.UpdateValidation.validate(data);
    if (error) return Response.badRequest(error.message);

    const [updated] = await this.model.update(data, {
      where: { employeeId },
    });

    if (!updated) return Response.notFound("Funcionário não encontrado!");

    const result = await this.model.findByPk(employeeId, {
      include: [PersonModel, CompanyModel, PositionModel, SectorModel, DepartmentModel],
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
      include: [PersonModel, CompanyModel, PositionModel, SectorModel, DepartmentModel],
    });

    if (!result) return Response.notFound("Funcionário não encontrado!");
    return Response.ok("Funcionário encontrado!", result);
  }

  async findEmployees(query: Partial<EmployeeInterface>) {
    const where: any = {};

    if (query.registration) {
      where.registration = { [Op.iLike]: `%${query.registration}%` };
    }

    if (query.fkEmployeePersonId) {
      where.fkEmployeePersonId = query.fkEmployeePersonId;
    }

    const result = await this.model.findAll({
      where,
      include: [PersonModel, CompanyModel, PositionModel, SectorModel, DepartmentModel],
      
    });

    if (!result.length) {
      return Response.notFound("Nenhum funcionário encontrado.");
    }

    return Response.ok("Funcionários encontrados com sucesso", result);
  }

  async bulkInsert(payload: {
    companyCode: string;
    employees: {
      registration: string;
      fullName: string;
      admissionDate: string;
      position: string;
      birthDate: string;
    }[];
  }) {

    const { companyCode, employees: employeeList } = payload;

    if (!employeeList.length) {
      return Response.badRequest("Lista de funcionários vazia.");
    }

    if (!companyCode) {
      return Response.badRequest("Código da empresa não informado.");
    }

    const company = await CompanyModel.findOne({
      where: { companyAcronym: companyCode }
    });

    if (!company) {
      return Response.notFound("Empresa não encontrada.");
    }

    const personService = new PersonService();
    const positionService = new PositionService();
    const createdEmployees = [];

    for (const emp of employeeList) {
      const { fullName, registration, admissionDate, position, birthDate } = emp;

      // Verifica se funcionário já existe
      const existingEmployee = await this.model.findOne({ where: { registration } });
      if (existingEmployee) {
        console.warn(`Funcionário com matrícula ${registration} já existe. Ignorando.`);
        continue;
      }

      // Divisão do nome
      const nameParts = fullName.trim().split(/\s+/);

      const firstName = nameParts[0];
      const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
      
      const parsedAdmissionDate = parse(admissionDate, "dd/MM/yyyy", new Date());
      const parsedBirthDate = parse(birthDate, "dd/MM/yyyy", new Date());

      const personPayload = {
        //personId: uuidv4(),
        fullName,
        firstName,
        lastName,
        birthDate: parsedBirthDate, // assumindo que PersonModel aceita essa propriedade
      };

      const personResult = await personService.createPerson(personPayload as any);

      if (personResult.status !== 201 || !('data' in personResult)) {
        console.error(`Erro ao criar pessoa ${fullName}:`, personResult.message);
        continue;
      }

      const personData = personResult.data as { personId: string };
      const fkEmployeePersonId = personData.personId;

      // Buscar cargo
      let fkEmployeePositionId: string | undefined = undefined;
      const positionResult = await positionService.findPositions({ positionName: position });
      if (positionResult.status === 200 && ('data' in positionResult) && Array.isArray(positionResult.data)) {
        const positionData = positionResult.data[0] as { positionId: string };
        fkEmployeePositionId = positionData.positionId;
      } else {
        console.warn(`Cargo '${position}' não encontrado. Continuando sem atribuir posição.`);
      }

      await this.model.create({
        //employeeId: uuidv4(),
        registration,
        fkEmployeePersonId,
        admissionDate: parsedAdmissionDate,
        fkEmployeePositionId,
        fkEmployeeCompanyId: company.companyId
      });

      createdEmployees.push({
        registration,
        fullName,
      });
    }

    return Response.created("Funcionários inseridos com sucesso!", createdEmployees);
  }
}

export default EmployeeService;
