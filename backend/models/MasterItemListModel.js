const conn = require("../connect");
const { DataTypes } = require("sequelize");

const MasterList = conn.define('MasterList', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },  
  Country_Code: DataTypes.STRING,
  Country_Name: DataTypes.STRING,
  Company_Code: DataTypes.STRING,
  Company_Name: DataTypes.STRING,
  Place_Code: DataTypes.STRING,
  Place_Name: DataTypes.STRING,
  Section_Code: DataTypes.STRING,
  Section_Name: DataTypes.STRING,
  Machine_No: DataTypes.STRING,
  Process_Group_Code: DataTypes.STRING,
  Process_Group_Name: DataTypes.STRING,
  Process_Code: DataTypes.STRING,
  Process_Name: DataTypes.STRING,

  
}, {

  tableName: 'masters_item_list',
  timestamps: true,
});

module.exports = MasterList;