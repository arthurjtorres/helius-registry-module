// CorporationModel

import { DataTypes, Model } from "sequelize";
import db from ".";
import sequelize from "sequelize";

class CorporationModel extends Model {
  declare corporationId: string;
  declare corporationName: string;
  declare corporationCode: string;
  declare corporationAcronym: string;

  declare createdAt: Date;
  declare createdBy: string;
  declare updatedAt: Date;
  declare updatedBy: string;
  declare activated: boolean;
}

CorporationModel.init({
  corporationId: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
  },
  corporationName: {
    type: sequelize.STRING,
    allowNull: false,
  },
  corporationCode: {
    type: sequelize.STRING,
    allowNull: true,
  },
  corporationAcronym: {
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
},{
  sequelize: db,
    tableName: 'corporation',
    schema: 'registry',
    timestamps: false,
    underscored: true
});

export default CorporationModel;