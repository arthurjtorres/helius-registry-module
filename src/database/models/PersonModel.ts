// PersonModel

import sequelize from "sequelize";
import { DataTypes, Model } from "sequelize";
import db from ".";

class PersonModel extends Model {
  declare personId: string;
  declare firstName: string;
  declare lastName: string;
  declare fullName: string;
  declare birthDate: Date;

  declare createdAt: Date;
  declare createdBy: string;
  declare updatedAt: Date;
  declare updatedBy: string;
}

PersonModel.init({
  personId: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
  },
  firstName: {
    type: sequelize.STRING,
    allowNull: false,
  },
  lastName: {
    type: sequelize.STRING,
    allowNull: false,
  },
  fullName: {
    type: sequelize.STRING,
    allowNull: false,
  },
  birthDate: {
    type: sequelize.DATEONLY,
    allowNull: true,
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
  tableName: 'person',
  schema: 'registry',
  timestamps: false,
  underscored: true
});

export default PersonModel;