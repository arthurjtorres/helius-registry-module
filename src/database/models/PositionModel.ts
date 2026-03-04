// PositionModel

import { DataTypes, Model } from "sequelize";
import db from "./database";
import sequelize from "sequelize";


class PositionModel extends Model {
  declare positionId: string;
  declare positionName: string;
  declare positionCode: number;

  declare createdAt: Date;
  declare createdBy: string;
  declare updatedAt: Date;
  declare updatedBy: string;
  declare activated: boolean;
}

PositionModel.init({
  positionId: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
  },
  positionName: {
    type: sequelize.STRING,
    allowNull: false,
  },
  positionCode: {
    type: sequelize.INTEGER,
    allowNull: false,
    unique: true,
    autoIncrement: true, // simbólico para compatibilidade com UUID PK
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
  tableName: 'position',
  schema: 'registry',
  timestamps: false,
  underscored: true,
}
);



export default PositionModel;
