// migration companyGroup

"use strict";

const { DataTypes } = require("sequelize");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      "company_group",
      {
        group_id: {
          type: DataTypes.UUID,
          primaryKey: true,
          defaultValue: DataTypes.UUIDV4,
          allowNull: false,
        },
        group_name: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        created_at: {
          allowNull: false,
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        },
        created_by: {
          allowNull: false,
          type: DataTypes.UUID,
          references: {
            model: {
              tableName: "user",
              schema: "access_control",
            },
            key: "user_id",
          },
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
        },
        updated_at: {
          allowNull: false,
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        },
        updated_by: {
          allowNull: false,
          type: DataTypes.UUID,
          references: {
            model: {
              tableName: "user",
              schema: "access_control",
            },
            key: "user_id",
          },
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
        },
        activated: {
          allownull: false,
          type: Sequelize.BOOLEAN,
          defaultValue: true,
        },
      },
      {
        schema: "registry",
      }
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("company_group", {
      schema: "registry",
    });
  },
};
