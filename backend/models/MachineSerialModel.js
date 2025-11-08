const conn = require("../connect");
const { DataTypes } = require("sequelize");

const MachineSerial = conn.define('MachineSerial', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },  
  Machine_No: DataTypes.STRING,
  Serial_No: DataTypes.STRING,
  Model: DataTypes.STRING,
  Maker: DataTypes.STRING,
  
}, {

  tableName: 'machines_serial',
  timestamps: true,
});

module.exports = MachineSerial;
