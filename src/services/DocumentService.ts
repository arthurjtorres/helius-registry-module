import { ModelStatic, Op } from "sequelize";
import Response from "../utils/Response";

import CreateValidationSchema from "./validations/CreateValidationSchema";
import UpdateValidationSchema from "./validations/UpdateValidationSchema";

import { DocumentModel, PersonModel } from "../database/models";

import DocumentInterface from "../database/interfaces/DocumentInterface";

class DocumentService {
  private model: ModelStatic<DocumentModel> = DocumentModel;

  async createDocument(data: DocumentInterface) {
    data.createdAt = new Date();

    const { error } = CreateValidationSchema.DocumentValidation.validate(data);
    if (error) return Response.badRequest(error.message);

    // Verifica se já existe documento desse tipo para a mesma pessoa
    const exists = await this.model.findOne({
      where: {
        fkPersonId: data.fkPersonId,
        documentType: data.documentType
      }
    });

    if (exists) {
      return Response.conflict("Esta pessoa já possui um documento deste tipo.");
    }

    await this.model.create({ ...data });
    return Response.created("Documento criado com sucesso!");
  }

  async updateDocument(id: string, data: Partial<DocumentInterface>) {

    if (!id) return Response.badRequest("ID não informado");
    data.updatedAt = new Date();

    const { error } = UpdateValidationSchema.DocumentValidation.validate(data);
    if (error) return Response.badRequest(error.message);

    const [updated] = await this.model.update(data, { where: { documentId: id } });

    if (!updated) return Response.notFound("Documento não encontrado!");

    const result = await this.model.findByPk(id, {
      include: [
        { model: PersonModel, as: 'Person' }
      ],
    });

    return Response.ok("Documento atualizado com sucesso!", result);
  }

  async deleteDocument(id: string) {
    const deleted = await this.model.destroy({ where: { documentId: id } });
    if (!deleted) return Response.notFound("Documento não encontrado!");
    return Response.ok("Documento deletado com sucesso!");
  }

  async getDocument(id: string) {
    if (!id) return Response.badRequest("ID do documento não informado.");

    const result = await this.model.findByPk(id, {
      include: [
        { model: PersonModel, as: 'Person' }
      ],
    });

    if (!result) return Response.notFound("Documento não encontrado!");
    return Response.ok("Documento encontrado!", result);
  }

  async findDocuments(query: Partial<DocumentInterface>) {
    const where: any = {};

    if (query.documentType) {
      where.documentType = query.documentType;
    }

    if (query.documentNumber) {
      where.documentNumber = { [Op.iLike]: `%${query.documentNumber}%` };
    }

    if (query.uf) {
      where.uf = query.uf;
    }

    if (query.fkPersonId) {
      where.fkDocumentPersonId = query.fkPersonId;
    }

    const result = await this.model.findAll({
      where,
      include: [
        { model: PersonModel, as: 'Person' }
      ],
    });

    if (!result.length) {
      return Response.notFound("Nenhum documento encontrado.");
    }

    return Response.ok("Documentos encontrados com sucesso", result);
  }
}

export default DocumentService;