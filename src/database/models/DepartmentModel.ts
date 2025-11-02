// DepartmentModel

import { DataTypes, Model } from "sequelize";
import db from ".";
import sequelize from "sequelize";

class DepartmentModel extends Model {
  declare departmentId: string;
  declare departmentName: string;
  declare departmentAlias: string;
  declare departmentIndex: number;

  declare createdAt: Date;
  declare createdBy: string;
  declare updatedAt: Date;
  declare updatedBy: string;
}

DepartmentModel.init(
  {
    departmentId: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
    },
    departmentName: {
      type: sequelize.STRING,
      allowNull: false,
    },
    departmentAlias: {
      type: sequelize.STRING,
      allowNull: false,
    },
    departmentIndex: {
      type: sequelize.INTEGER,
      allowNull: false,
      unique: true,
      autoIncrement: true, // Apenas simbólico: PostgreSQL + UUID PK não suporta autoIncrement real
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
    tableName: "department",
    schema: "registry",
    timestamps: false,
    underscored: true,
  }
);

export default DepartmentModel;
