const Sequelize = require('sequelize');

const sequelize = require('./database');

const orders = sequelize.define('order', {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true
  }
});

module.exports = orders;
