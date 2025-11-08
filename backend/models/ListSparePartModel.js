const conn = require("../connect");
const { DataTypes } = require("sequelize");

const SparePart = conn.define('SparePart', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },  
  name_spare: DataTypes.STRING,
  spec_spare: DataTypes.STRING,
  maker_spare: DataTypes.STRING,
  unit_spare: DataTypes.STRING,

  
}, {

  tableName: 'lists_spare_part',
  timestamps: true,
});

module.exports = SparePart;
