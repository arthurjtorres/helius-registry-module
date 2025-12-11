// EmployeeModel

import { DataTypes, Model } from "sequelize";
import db from ".";
import PersonModel from "./PersonModel";
import CompanyModel from "./CompanyModel";
import PositionModel from "./PositionModel";
import sequelize from "sequelize";
import SectorModel from "./SectorModel";
import DepartmentModel from "./DepartmentModel";

class EmployeeModel extends Model {
  declare employeeId: string;
  declare registration: string;
  declare admissionDate: Date;
  declare fkEmployeePersonId: string;
  declare fkEmployeeCompanyId?: string;
  declare fkEmployeePositionId?: string;
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
  fkEmployeePersonId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  fkEmployeeCompanyId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  fkEmployeePositionId: {
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
    allowNull: false,
    type: sequelize.DATE,
    defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
  },
  updatedBy: {
    allowNull: false,
    type: DataTypes.UUID,

  },
  activated: {
    allowNull: false,
    type: sequelize.BOOLEAN,
    defaultValue: true,
  },
}, {
  sequelize: db,
  tableName: "employee",
  schema: "registry",
  timestamps: false,
  underscored: true,
});

EmployeeModel.belongsTo(PersonModel, {
  foreignKey: 'fkEmployeePersonId'
});

EmployeeModel.belongsTo(CompanyModel, {
  foreignKey: "fkEmployeeCompanyId",
});

EmployeeModel.belongsTo(PositionModel, {
  foreignKey: "fkEmployeePositionId",
});

EmployeeModel.belongsTo(SectorModel, {
  foreignKey: "fkSectorId",
});

EmployeeModel.belongsTo(DepartmentModel, {
  foreignKey: "fkDepartmentId",
});

export default EmployeeModel;