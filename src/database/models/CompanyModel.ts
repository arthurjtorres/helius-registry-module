// CompanyModel

import { DataTypes, Model } from "sequelize";
import db from ".";
import sequelize from "sequelize";
import CorporationModel from "./CorporationModel";
import CompanyGroupModel from "./CompanyGroupModel";

class CompanyModel extends Model {
  declare companyId: string;
  declare companyName: string;
  declare companyCode?: string;
  declare companyAcronym: string;
  declare fkCompanyCorporationId: string;
  declare fkCompanyGroupId: string;

  declare createdAt: Date;
  declare createdBy: string;
  declare updatedAt: Date;
  declare updatedBy: string;
}

CompanyModel.init(
  {
    companyId: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
    },
    companyName: {
      type: sequelize.STRING,
      allowNull: false,
    },
    companyCode: {
      type: sequelize.STRING,
      allowNull: true,
    },
    companyAcronym: {
      type: sequelize.STRING,
      unique: true,
      allowNull: false,
    },
    fkCompanyCorporationId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "corporation",
        key: "corporation_id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    fkCompanyGroupId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "company_group",
        key: "group_id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
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

  },
  {
    sequelize: db,
    tableName: "company",
    schema: "registry",
    timestamps: false,
    underscored: true,
  }
);

// Associações
CompanyModel.belongsTo(CorporationModel, {
  foreignKey: "fkCompanyCorporationId",
});

CompanyModel.belongsTo(CompanyGroupModel, {
  foreignKey: "fkCompanyGroupId",
});

CorporationModel.hasMany(CompanyModel, {
  foreignKey: "fkCompanyCorporationId",
});

CompanyGroupModel.hasMany(CompanyModel, {
  foreignKey: "fkCompanyGroupId",
});

export default CompanyModel;
