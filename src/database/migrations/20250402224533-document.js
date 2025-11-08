// migration document

'use strict';

const { DataTypes } = require('sequelize');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable(
      'document',
      {
        document_id :{
          type: DataTypes.UUID,
          primaryKey: true,
          defaultValue: DataTypes.UUIDV4,
          allowNull: false,
        },
        document_type:{
          type: Sequelize.STRING,
          allowNull: false
        },
        document_number: {
          type: Sequelize.STRING,
          allowNull: false,
          unique: true,
        },
        document_photo: {
          type: DataTypes.BLOB,
          allowNull: true,
        },
        org_emitter: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        uf: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        issue_date: {
          type: Sequelize.DATEONLY,
          allowNull: false,
        },
        validation_date: {
          type: Sequelize.DATEONLY,
          allowNull: true,
        },
        mother_name: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        father_name: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        fk_document_person_id: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: 'person',
            key: 'person_id',
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
        schema: 'registry'
      }
    );

    await queryInterface.addConstraint('document', {
      fields: [ 'fk_document_person_id', 'document_type'],
      type: 'unique',
      name: 'unique_document_type_per_person',
      schema: 'registry',
    })
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('document', {
      schema: 'registry'
    })
  }
};
