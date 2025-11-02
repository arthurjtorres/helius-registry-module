import { Sequelize } from "sequelize";
import * as config from "../config/DatabaseConfig";

export default new Sequelize(config);