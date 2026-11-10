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

    // Verifica unicidade (número do documento e tipo por pessoa), inclusive contra registros inativos
    const byNumber = await this.model.findOne({ where: { documentNumber: data.documentNumber } });
    const byType = await this.model.findOne({
      where: { fkPersonId: data.fkPersonId, documentType: data.documentType }
    });
    const existing = byNumber ?? byType;

    if (existing) {
      return Response.conflict(
        existing.activated
          ? (byNumber ? "Este número de documento já está cadastrado." : "Esta pessoa já possui um documento deste tipo.")
          : `Já existe um documento inativo com estes dados (id: ${existing.documentId}). Reative-o em PATCH /document/${existing.documentId}/reactivate.`
      );
    }

    await this.model.create({ ...data });
    return Response.created("Documento criado com sucesso!");
  }

  async updateDocument(id: string, data: Partial<DocumentInterface>) {

    if (!id) return Response.badRequest("ID não informado");
    data.updatedAt = new Date();

    const { error } = UpdateValidationSchema.DocumentValidation.validate(data);
    if (error) return Response.badRequest(error.message);

    const [updated] = await this.model.update(data, { where: { documentId: id, activated: true } });

    if (!updated) return Response.notFound("Documento não encontrado!");

    const result = await this.model.findOne({
      where: { documentId: id, activated: true },
      include: [
        { model: PersonModel, as: 'Person', where: { activated: true }, required: false }
      ],
    });

    return Response.ok("Documento atualizado com sucesso!", result);
  }

  /**
   * Desativa o registro (exclusão lógica): `activated = false`.
   * @param id Identificador do registro.
   * @param updatedBy Usuário autenticado que executa a operação.
   */
  async deleteDocument(id: string, updatedBy: string) {
    if (!id) return Response.badRequest("ID não informado");

    const [updated] = await this.model.update(
      { activated: false, updatedBy, updatedAt: new Date() },
      { where: { documentId: id, activated: true } }
    );
    if (!updated) return Response.notFound("Documento não encontrado!");

    return Response.ok("Documento desativado com sucesso!");
  }

  /**
   * Reativa um registro desativado (`activated = true`).
   * @param id Identificador do registro.
   * @param updatedBy Usuário autenticado que executa a operação.
   */
  async reactivateDocument(id: string, updatedBy: string) {
    if (!id) return Response.badRequest("ID não informado");

    const [updated] = await this.model.update(
      { activated: true, updatedBy, updatedAt: new Date() },
      { where: { documentId: id, activated: false } }
    );
    if (!updated) return Response.notFound("Documento não encontrado ou já ativo!");

    return Response.ok("Documento reativado com sucesso!");
  }

  async getDocument(id: string) {
    if (!id) return Response.badRequest("ID do documento não informado.");

    const result = await this.model.findOne({
      where: { documentId: id, activated: true },
      include: [
        { model: PersonModel, as: 'Person', where: { activated: true }, required: false }
      ],
    });

    if (!result) return Response.notFound("Documento não encontrado!");
    return Response.ok("Documento encontrado!", result);
  }

  async findDocuments(query: Partial<DocumentInterface>) {
    const where: any = { activated: true };

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
        { model: PersonModel, as: 'Person', where: { activated: true }, required: false }
      ],
    });

    if (!result.length) {
      return Response.notFound("Nenhum documento encontrado.");
    }

    return Response.ok("Documentos encontrados com sucesso", result);
  }
}

export default DocumentService;