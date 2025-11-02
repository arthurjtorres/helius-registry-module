// CompanyGroupModel

import { DataTypes, Model } from "sequelize";
import db from ".";
import sequelize from "sequelize";

class CompanyGroupModel extends Model {
  declare groupId: string;
  declare groupName: string;

  declare createdAt: Date;
  declare createdBy: string;
  declare updatedAt: Date;
  declare updatedBy: string;
}

CompanyGroupModel.init({
  groupId: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
  },
  groupName: {
    type: sequelize.STRING,
    allowNull: false,
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
    tableName: 'company_group',
    schema: 'registry',
    timestamps: false,
    underscored: true
  });

export default CompanyGroupModel;