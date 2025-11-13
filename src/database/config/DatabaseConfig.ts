import 'dotenv/config'
import { Options } from 'sequelize'


  const config: Options = {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,  // Já compartilhado no .env
    host: process.env.DB_HOST,
    dialect: 'postgres',
  }
  /*
  ,
  "test": {
    "username": "root",
    "password": null,
    "database": "database_test",
    "host": "127.0.0.1",
    "dialect": "mysql"
  },
  "production": {
    "username": "root",
    "password": null,
    "database": "database_production",
    "host": "127.0.0.1",
    "dialect": "mysql"
  }*/

    export = config