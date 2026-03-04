// DocumentModel

import { DataTypes, Model } from "sequelize";
import db from "./database";
import sequelize from "sequelize";
import { DocumentTypeEnum } from "./enums/DocumentTypeEnum";

class DocumentModel extends Model {
  declare documentId: string;
  declare documentType: DocumentTypeEnum;
  declare documentNumber: string;
  declare documentPhoto?: Blob;
  declare orgEmitter?: string;
  declare uf?: string;
  declare issueDate?: Date
  declare validationDate?: Date
  declare motherName?: string;
  declare fatherName?: string;
  declare fkPersonId: string;

  declare createdAt: Date;
  declare createdBy: string;
  declare updatedAt?: Date;
  declare updatedBy?: string;
  declare activated: boolean;
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
    allowNull: true,
  },
  uf: {
    type: sequelize.STRING,
    allowNull: true,
  },
  issueDate: {
    type: sequelize.DATEONLY,
    allowNull: true,
  },
  validationDate: {
    type: sequelize.DATEONLY,
    allowNull: true,
  },
  motherName: {
    type: sequelize.STRING,
    allowNull: true,
  },
  fatherName: {
    type: sequelize.STRING,
    allowNull: true,
  },
  fkPersonId: {
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
    allowNull: true,
    type: sequelize.DATE,
    defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
  },
  updatedBy: {
    allowNull: true,
    type: DataTypes.UUID,

  },
  activated: {
    allowNull: false,
    type: sequelize.BOOLEAN,
    defaultValue: true,
  },
}, {
  sequelize: db,
  tableName: 'document',
  schema: 'registry',
  timestamps: false,
  underscored: true
});

export default DocumentModel;