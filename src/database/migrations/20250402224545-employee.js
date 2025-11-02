// migration employee
'use strict';

const { DataTypes } = require('sequelize');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'employee',
      {
        employee_id: {
          type: DataTypes.UUID,
          primaryKey: true,
          defaultValue: DataTypes.UUIDV4,
          allowNull: false,
        },
        registration: {
          type: Sequelize.STRING,
          allowNull: false,
          unique: true,
        },
        admission_date:{
          type: Sequelize.DATEONLY,
          allowNull: false,
        },
        fk_employee_person_id: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: 'person',
            key: 'person_id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        fk_employee_company_id: {
          type: DataTypes.UUID,
          allowNull: true,
          references: {
            model: 'company',
            key: 'company_id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        fk_employee_position_id: {
          type: DataTypes.UUID,
          allowNull: true,
          references: {
            model: 'position',
            key: 'position_id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },

        fk_sector_id: {
          type: DataTypes.UUID,
          allowNull: true,
          references: {
            model: 'sector',
            key: 'sector_id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        fk_department_id: {
          type: DataTypes.UUID,
          allowNull: true,
          references: {
            model: 'department',
            key: 'department_id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
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
      },
      {
        schema: 'registry',
      }
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('employee', {
      schema: 'registry',
    });
  },
};
