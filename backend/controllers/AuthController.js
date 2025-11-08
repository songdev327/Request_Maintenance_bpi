// backend/controllers/AuthController.js
const express = require("express");
const jwt = require("jsonwebtoken");
const UserModel = require("../models/UserModel");

const app = express();

const JWT_SECRET  = process.env.JWT_SECRET  || "dev-secret";
const JWT_EXPIRES = process.env.JWT_EXPIRES || "8h";

// -------- middlewares --------
function requireAuth(req, res, next) {
  try {
    const h = req.headers.authorization || "";
    const token = h.startsWith("Bearer ") ? h.slice(7) : null;
    if (!token) return res.status(401).json({ message: "Unauthorized" });
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ message: "Unauthorized" });
  }
}
function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  if ((req.user.permissions || "").toLowerCase() !== "admin") {
    return res.status(403).json({ message: "Forbidden: admin only" });
  }
  next();
}

const bcrypt = require("bcryptjs");   // ต้องมี

app.post('/login', async (req, res) => {
  try {
    const { password, process } = req.body || {};
    if (!process || !password) {
      return res.status(400).json({ message: 'กรุณากรอก process และ password' });
    }

    const users = await UserModel.findAll({
      where: { process, isActive: true }
    });

    if (!users || users.length === 0) {
      return res.status(401).json({ message: 'ไม่พบผู้ใช้สำหรับ process นี้' });
    }

    const checkPassword = async (u, pwd) => {
      const hashed = u.password;
      const plainBackup = u.password_input;

      if (hashed && hashed.startsWith('$2')) {
        return bcrypt.compare(pwd, hashed); // ✅ ใช้ bcrypt ได้แล้ว
      }
      if (hashed && !hashed.startsWith('$2')) {
        return pwd === hashed;
      }
      if (plainBackup) {
        return pwd === plainBackup;
      }
      return false;
    };

    let matched = null;
    for (const u of users) {
      if (await checkPassword(u, password)) { matched = u; break; }
    }

    if (!matched) {
      return res.status(401).json({ message: 'รหัสผ่านไม่ถูกต้อง' });
    }

    if (matched.password && !matched.password.startsWith('$2')) {
      matched.password = await bcrypt.hash(password, 10);
      matched.password_input = null;
      await matched.save();
    }

    const payload = {
      id: matched.id,
      process: matched.process,
      permissions: matched.permissions || 'user'
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });

    return res.json({
      token,
      user: {
        id: matched.id,
        process: matched.process,
        permissions: matched.permissions || 'user'
      }
    });
  } catch (err) {
    console.error('login error:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' });
  }
});

app.post("/loginSetting", async (req, res) => {
  try {
    const { password, process } = req.body || {};
    if (!process || !password) {
      return res.status(400).json({ message: "กรุณากรอก process และ password" });
    }

    // ดึงผู้ใช้ทั้งหมดของ process นี้ที่เปิดใช้งาน
    const users = await UserModel.findAll({
      where: { process, isActive: true }
    });
    if (!users || users.length === 0) {
      return res.status(401).json({ message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });
    }

    // ฟังก์ชันตรวจรหัสผ่าน (รองรับ hash/plain/password_input)
    const checkPassword = async (u, pwd) => {
      const hashed = u.password;
      const plainBackup = u.password_input;

      if (hashed && hashed.startsWith("$2")) {
        return bcrypt.compare(pwd, hashed);
      }
      if (hashed && !hashed.startsWith("$2")) {
        return pwd === hashed;
      }
      if (plainBackup) {
        return pwd === plainBackup;
      }
      return false;
    };

    // หา user ที่รหัสผ่านตรง
    let matched = null;
    for (const u of users) {
      if (await checkPassword(u, password)) { matched = u; break; }
    }
    if (!matched) {
      return res.status(401).json({ message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });
    }

    // ถ้าเจอว่าเก็บ plain → แฮชและบันทึกกลับ (optional แต่แนะนำ)
    if (matched.password && !matched.password.startsWith("$2")) {
      matched.password = await bcrypt.hash(password, 10);
      matched.password_input = null;
      await matched.save();
    }

    // สร้าง token (อย่าบังคับ default เป็น admin)
    const payload = {
      id: matched.id,
      permissions: matched.permissions || "user",
      process: matched.process || ""
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });

    return res.json({
      token,
      user: {
        id: matched.id,
        permissions: matched.permissions || "user",
        process: matched.process
      }
    });
  } catch (err) {
    console.error("loginSetting error:", err);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการเข้าสู่ระบบ" });
  }
});


// ตรวจ token ตัวเอง
app.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// ✅ export เป็น “ฟังก์ชัน (app)” พร้อมแนบพร็อพ middleware
module.exports = app;
module.exports.requireAuth = requireAuth;
module.exports.requireAdmin = requireAdmin;
