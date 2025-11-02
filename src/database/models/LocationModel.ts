// LocationModel

import { DataTypes, Model } from "sequelize";
import { LocationTypeEnum } from "./enums/LocationTypeEnum";
import sequelize from "sequelize";
import db from ".";

class LocationModel extends Model {
  declare locationId: string;
  declare locationName: string;
  declare locationCode: string;
  declare locationType: LocationTypeEnum;
  declare locationAcronym: string;

  declare createdAt: Date;
  declare createdBy: string;
  declare updatedAt: Date;
  declare updatedBy: string;
}

LocationModel.init({
  locationId: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
  },
  locationName: {
    type: sequelize.STRING,
    allowNull: false,
  },
  locationCode: {
    type: sequelize.STRING,
    allowNull: false,
  },
  locationType: {
    type: sequelize.STRING,
    allowNull: false,
    validate: {
      isIn: [[...Object.values(LocationTypeEnum)]],
    }
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
  locationAcronym: {
    type: sequelize.STRING,
  }
}, {
  sequelize: db,
  tableName: 'location',
  schema: 'registry',
  timestamps: false,
  underscored: true
});

export default LocationModel;