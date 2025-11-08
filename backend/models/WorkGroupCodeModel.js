const conn = require("../connect");
const { DataTypes } = require("sequelize");

const WorkGroup = conn.define('WorkGroup', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },  
  Work_Group_Code: DataTypes.STRING,
  Work_Group_Name: DataTypes.STRING,
  Work_Type_Code: DataTypes.STRING,
  Work_Type_Name: DataTypes.STRING,

  
}, {

  tableName: 'work_group_code',
  timestamps: true,
});

module.exports = WorkGroup;
