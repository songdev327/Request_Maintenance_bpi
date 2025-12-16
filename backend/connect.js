const { Sequelize } = require('sequelize');

const sequelize = new Sequelize("Maintenance_request", "postgres", "m1nebea", {
  host: "localhost",
  dialect: "postgres",
  logging: false,
  port: 5433,
});

module.exports = sequelize;

// const { Sequelize } = require('sequelize');

// const sequelize = new Sequelize("Maintenance_request", "postgres", "m1nebea", {
//   host: "192.168.96.126",
//   dialect: "postgres",
//   logging: false,
//   port: 5433,
// });

// module.exports = sequelize;