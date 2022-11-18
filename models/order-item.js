const Sequelize = require('sequelize');

const sequelize = require('./database');

const orderItems = sequelize.define('orderItems', {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true
  },
  quantity:Sequelize.INTEGER,
});

module.exports = orderItems;
