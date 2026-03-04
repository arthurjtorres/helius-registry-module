// EmployeeModel

import { DataTypes, Model } from "sequelize";
import db from ".";
import sequelize from "sequelize";

class EmployeeModel extends Model {
  declare employeeId: string;
  declare registration: string;
  declare admissionDate: Date;
  declare fkPersonId: string;
  declare fkCompanyId?: string;
  declare fkPositionId?: string;
  declare fkSectorId: string;
  declare fkDepartmentId: string;

  declare createdAt: Date;
  declare createdBy: string;
  declare updatedAt: Date;
  declare updatedBy: string;
  declare activated: boolean;
}

EmployeeModel.init({
  employeeId: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
  },
  registration: {
    type: sequelize.STRING,
    allowNull: false,
    unique: true,
  },
  admissionDate: {
    type: sequelize.DATEONLY,
    allowNull: true,
  },
  fkPersonId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  fkCompanyId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  fkPositionId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  fkSectorId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  fkDepartmentId: {
    type: DataTypes.UUID,
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
  tableName: 'employee',
  schema: 'registry',
  timestamps: false,
  underscored: true,
});

export default EmployeeModel;