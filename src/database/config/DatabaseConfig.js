"use strict";
require("dotenv/config");
const config = {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME, // Já compartilhado no .env
    host: process.env.DB_HOST,
    dialect: 'postgres',
};
module.exports = config;
