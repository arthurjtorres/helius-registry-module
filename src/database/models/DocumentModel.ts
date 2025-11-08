// DocumentModel

import { DataTypes, Model } from "sequelize";
import { DocumentTypeEnum } from "./enums/DocumentTypeEnum";
import db from ".";
import sequelize from "sequelize";
import PersonModel from "./PersonModel";

class DocumentModel extends Model {
  declare documentId: string;
  declare documentType: DocumentTypeEnum;
  declare documentNumber: string;
  declare documentPhoto: Blob;
  declare orgEmitter: string;
  declare uf: string;
  declare issueDate: Date
  declare validationDate?: Date
  declare motherName: string;
  declare fatherName: string;
  declare fkDocumentPersonId: string;

  declare createdAt: Date;
  declare createdBy: string;
  declare updatedAt: Date;
  declare updatedBy: string;
}

DocumentModel.init({
  documentId: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
  },
  documentType: {
    type: sequelize.STRING,
    allowNull: false,
    validate: {
      isIn: [[...Object.values(DocumentTypeEnum)]],
    }
  },
  documentNumber: {
    type: sequelize.STRING,
    allowNull: false,
    unique: true,
  },
  documentPhoto: {
    type: DataTypes.BLOB,
    allowNull: true,
  },
  orgEmitter: {
    type: sequelize.STRING,
    allowNull: false,
  },
  uf: {
    type: sequelize.STRING,
    allowNull: false,
  },
  issueDate: {
    type: sequelize.DATEONLY,
    allowNull: false,
  },
  validationDate: {
    type: sequelize.DATEONLY,
    allowNull: true,
  },
  motherName: {
    type: sequelize.STRING,
    allowNull: false,
  },
  fatherName: {
    type: sequelize.STRING,
    allowNull: true,
  },
  fkDocumentPersonId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'person',
      key: 'person_id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  },

  createdAt: {
    allowNull: false,
    type: sequelize.DATE,
    defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
  },
  createdBy: {
    allowNull: false,
    type: DataTypes.UUID,

  },
  updatedAt: {
    allowNull: false,
    type: sequelize.DATE,
    defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
  },
  updatedBy: {
    allowNull: false,
    type: DataTypes.UUID,

  },
}, {
  sequelize: db,
  tableName: 'document',
  schema: 'registry',
  timestamps: false,
  underscored: true
});

DocumentModel.belongsTo(PersonModel, {
  foreignKey: 'fkDocumentPersonId'
});

PersonModel.hasMany(DocumentModel, {
  foreignKey: 'fkDocumentPersonId'
});

export default DocumentModel;