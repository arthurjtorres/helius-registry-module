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
      allowNull: false,
      type: sequelize.DATE,
      defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
    },
    updatedBy: {
      allowNull: false,
      type: DataTypes.UUID,
      
    },
},{
  sequelize: db,
    tableName: 'corporation',
    schema: 'registry',
    timestamps: false,
    underscored: true
});

export default CorporationModel;