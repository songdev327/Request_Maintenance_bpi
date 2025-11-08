const conn = require("../connect");
const { DataTypes } = require("sequelize");
const bcrypt = require("bcryptjs");

const UserModel = conn.define("users", {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  username: { type: DataTypes.STRING(255), allowNull: false, unique: false },
  lastname: { type: DataTypes.STRING(100) },
  employee: { type: DataTypes.STRING(100) },
  password: { type: DataTypes.STRING(100) }, // เก็บ hash ก็ได้
  permissions: { type: DataTypes.STRING(100) },
  typemc: { type: DataTypes.STRING(100) },
  password_input: { type: DataTypes.STRING(100) },
  process: { type: DataTypes.STRING(100) },
  isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, {
  tableName: "users",
  timestamps: true,
});

// แฮชเฉพาะตอน "สร้าง" หรือ "แก้ไข" ถ้ามีเปลี่ยน password
UserModel.addHook("beforeSave", async (user) => {
  if (user.changed("password") && user.password) {
    // ถ้ารหัสผ่านที่ใส่มา “ยังไม่ใช่” bcrypt hash ค่อยแฮช
    const looksHashed = typeof user.password === "string" && user.password.startsWith("$2");
    if (!looksHashed) {
      user.password = await bcrypt.hash(user.password, 10);
    }
  }
});

// method เช็ครหัสผ่าน (รองรับทั้ง hash และ plain เดิม)
UserModel.prototype.verifyPassword = async function (plain) {
  const current = this.password || "";
  if (current.startsWith("$2")) {
    return bcrypt.compare(plain, current);
  }
  // fallback: plain เทียบตรง (สำหรับข้อมูลเก่า)
  return plain === current;
};

module.exports = UserModel;