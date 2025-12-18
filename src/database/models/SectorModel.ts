// SectorModel

import { DataTypes, Model } from "sequelize";
import db from ".";
import sequelize from "sequelize";

class SectorModel extends Model {
  declare sectorId: string;
  declare sectorName: string;
  declare sectorAlias?: string;
  declare sectorIndex: number;

  declare createdAt: Date;
  declare createdBy: string;
  declare updatedAt: Date;
  declare updatedBy: string;
  declare activated: boolean;
}

SectorModel.init(
  {
    sectorId: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
    },
    sectorName: {
      type: sequelize.STRING,
      allowNull: false,
    },
    sectorAlias: {
      type: sequelize.STRING,
      allowNull: true,
    },
    sectorIndex: {
      type: sequelize.INTEGER,
      allowNull: false,
      unique: true,
      autoIncrement: true, // simbólico
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
  },
  {
    sequelize: db,
    tableName: "sector",
    schema: "registry",
    timestamps: false,
    underscored: true,
  }
);

export default SectorModel;
