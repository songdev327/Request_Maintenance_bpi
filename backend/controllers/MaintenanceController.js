const express = require("express");
const app = express();
const Maintenance = require("../models/MaintenanceModel");
// const { where } = require("sequelize");

const { Sequelize } = require('sequelize');

const ExcelJS = require("exceljs");

// POST: สร้างใบแจ้งซ่อม
app.post('/', async (req, res) => {
  try {
    const newRequest = await Maintenance.create(req.body);

    // ⬇️ Emit ออกไปให้ทุก client
    const io = req.app.get('io');
    io.emit('maintenance:new', newRequest.get({ plain: true }));

    res.status(201).json(newRequest);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Cannot create maintenance request' });
  }
});

// GET: ดูทั้งหมด
app.get('/', async (req, res) => {
  try {
    const requests = await Maintenance.findAll({
      limit: 500,   // ถ้าดึงทั้งหมดเอาบรรทัดนี้ออก
      order: [["id", "DESC"]],
    }

    );
    res.json(requests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Cannot fetch maintenance requests' });
  }
});

// backend/routes/section.js หรือรวมไว้กับ routes อื่น
app.get("/section-machines", async (req, res) => {
  try {
    const raw = await Maintenance.findAll({
      attributes: ['section', 'machine_request_name'],
      where: {
        section: { [Op.not]: null },
        machine_request_name: { [Op.not]: null },
      },
      group: ['section', 'machine_request_name'],
      order: [['section', 'ASC'], ['machine_request_name', 'ASC']]
    });

    // ✅ จัดกลุ่ม section -> [machines]
    const grouped = {};
    raw.forEach(item => {
      const section = item.section;
      const machine = item.machine_request_name;
      if (!grouped[section]) grouped[section] = [];
      grouped[section].push(machine);
    });

    res.json(grouped);
  } catch (err) {
    console.error("Error in /section-machines:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// app.get("/filter", async (req, res) => {
//   const { section, machine_name } = req.query;

//   if (!section || !machine_name) {
//     return res.status(400).json({ message: "Missing section or machine_name" });
//   }

//   try {
//     const rows = await Maintenance.findAll({
//       where: {
//         section,
//         machine_name: {
//           [Op.like]: `${machine_name}` // ✅ เผื่อกรณีค้นหาด้วย prefix เช่น "TN"
//         },
//       },
//       order: [["createdAt", "DESC"]]
//     });

//     res.json(rows);
//   } catch (err) {
//     console.error("❌ Error in /Maintenance/filter:", err);
//     res.status(500).json({ message: "Server error", detail: err.message });
//   }
// });
app.get("/filter", async (req, res) => {
  const { machine_name } = req.query;

  if (!machine_name) {
    return res.status(400).json({ message: "Missing section or machine_name" });
  }

  try {
    const rows = await Maintenance.findAll({
      where: {
        // section,
        machine_name: {
          [Op.like]: `${machine_name}` // ✅ เผื่อกรณีค้นหาด้วย prefix เช่น "TN"
        },
      },
      order: [["createdAt", "DESC"]]
    });

    res.json(rows);
  } catch (err) {
    console.error("❌ Error in /Maintenance/filter:", err);
    res.status(500).json({ message: "Server error", detail: err.message });
  }
});

// --- วางไว้ก่อน ---

const { Op } = require("sequelize");

app.get('/stats', async (req, res) => {
  try {
    const totalRequests = await Maintenance.count();

    const totalRequested = await Maintenance.count({
      where: { request_status: { [Op.in]: ['request', 'REQUEST'] } } // ใส่ alias ที่ใช้จริงเพิ่มได้
    });

    const totalPending = await Maintenance.count({
      where: { request_status: { [Op.in]: ['in progress', 'กำลังดำเนินการ'] } }
    });

    const totalCompleted = await Maintenance.count({
      where: { request_status: { [Op.in]: ['finished', 'finish', 'เสร็จสิ้น'] } }
    });

    const totalCancel = await Maintenance.count({
      where: { request_status: { [Op.in]: ['cancel', 'Cancel'] } }
    });

    const { QueryTypes } = require("sequelize");
    const conn = require("../connect");

    // (ทางเลือก) จำกัดช่วงเวลา เช่น 90 วันล่าสุด
    const days = Number(req.query.days ?? 30);

    const stats = await conn.query(`
      SELECT 
        date_trunc('day', "createdAt") AS date,
        COUNT(id) AS count
      FROM "maintenance_requests"
      WHERE "createdAt" >= NOW() - INTERVAL '${days} days'
      GROUP BY 1
      ORDER BY 1 ASC
    `, { type: QueryTypes.SELECT });

    res.json({ totalRequests, totalRequested, totalPending, totalCompleted, totalCancel, stats });
  } catch (error) {
    console.error('❌ Error fetching stats:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/recent', async (req, res) => {
  try {
    const limit = Number(req.query.limit ?? 5);
    const recentRequests = await Maintenance.findAll({
      order: [['createdAt', 'DESC']],
      limit
    });
    res.json(recentRequests);
  } catch (error) {
    console.error('Error fetching recent:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/machines', async (req, res) => {
  try {
    const { QueryTypes } = require("sequelize");
    const conn = require("../connect");

    const results = await conn.query(`
      SELECT DISTINCT "machine_name"
      FROM "maintenance_requests"
      WHERE "machine_name" IS NOT NULL AND "machine_name" <> ''
      ORDER BY "machine_name"
    `, { type: QueryTypes.SELECT });

    const machines = results.map(r => r.machine_name);
    res.json(machines);
  } catch (error) {
    console.error('Error fetching machines:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/statsPro', async (req, res) => {
  try {
    const { QueryTypes, Op } = require("sequelize");
    const conn = require("../connect");

    const where = {};
    const { machine_name, days = 30, month } = req.query;

    if (machine_name) {
      where.machine_name = machine_name;
    }

    // ✅ เงื่อนไขกรองเฉพาะเดือนปัจจุบัน
    if (month === '1') {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      where.createdAt = { [Op.gte]: startOfMonth };
    }

    const totalRequests = await Maintenance.count({ where });

    const totalRequested = await Maintenance.count({
      where: {
        ...where,
        request_status: { [Op.in]: ['request', 'REQUEST'] }
      }
    });

    const totalPending = await Maintenance.count({
      where: {
        ...where,
        request_status: { [Op.in]: ['in progress', 'กำลังดำเนินการ'] }
      }
    });

    const totalCompleted = await Maintenance.count({
      where: {
        ...where,
        request_status: { [Op.in]: ['finished', 'finish', 'เสร็จสิ้น'] }
      }
    });

    const totalCancel = await Maintenance.count({
      where: {
        ...where,
        request_status: { [Op.in]: ['cancel', 'Cancel'] }
      }
    });

    // 🟡 กราฟ trend ด้วย raw SQL
    let statQuery = `
      SELECT 
        date_trunc('day', "createdAt") AS date,
        COUNT(id) AS count
      FROM "maintenance_requests"
      WHERE 1=1
    `;
    const replacements = {};

    if (month === '1') {
      statQuery += ` AND "createdAt" >= :startOfMonth`;
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      replacements.startOfMonth = startOfMonth;
    } else {
      statQuery += ` AND "createdAt" >= NOW() - INTERVAL '${days} days'`;
    }

    if (machine_name) {
      statQuery += ` AND "machine_name" = :machine_name`;
      replacements.machine_name = machine_name;
    }

    statQuery += `
      GROUP BY 1
      ORDER BY 1 ASC
    `;

    const stats = await conn.query(statQuery, {
      type: QueryTypes.SELECT,
      replacements,
    });

    res.json({ totalRequests, totalRequested, totalPending, totalCompleted, totalCancel, stats });
  } catch (error) {
    console.error('❌ Error fetching stats:', error);
    res.status(500).json({ error: error.message });
  }
});


app.get('/recentPro', async (req, res) => {
  try {
    const { Op } = require("sequelize");
    const limit = Number(req.query.limit ?? 15);
    const { machine_name, month } = req.query;

    const where = {};

    if (machine_name) {
      where.machine_name = machine_name;
    }

    if (month === '1') {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      where.createdAt = { [Op.gte]: startOfMonth };
    }

    const recentRequests = await Maintenance.findAll({
      where,
      order: [['createdAt', 'DESC']],
      limit
    });

    res.json(recentRequests);
  } catch (error) {
    console.error('Error fetching recent:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});





app.get("/export", async (req, res) => {
  try {
    const where = {};
    if (req.query.status) where.request_status = req.query.status;

    const rows = await Maintenance.findAll({
      where,
      order: [["createdAt", "DESC"]],
    });

    const ExcelJS = require("exceljs");
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Maintenance");

    // ---- helpers ----
    const safe = (obj) => obj || {};
    const MAX_SPARES = 5;

    // ถ้า true → คืน label, ถ้า false → คืน ""
    const labelIf = (flag, label) => (flag ? label : "");

    // คอลัมน์พื้นฐาน
    const baseCols = [
      { header: "ID", key: "id", width: 8 },
      { header: "Created At", key: "createdAt", width: 20 },
      { header: "Date", key: "date", width: 12 },
      { header: "Time", key: "time", width: 10 },
      { header: "Machine", key: "machine_request_name", width: 25 },
      { header: "Machine Name", key: "machine_name", width: 18 },
      { header: "Machine No", key: "machine_no", width: 12 },
      { header: "Status MC", key: "machine_status", width: 18 },
      { header: "Request Status", key: "request_status", width: 16 },
      { header: "Receive By", key: "receive_by", width: 16 },
      { header: "Receive Time", key: "receive_time", width: 12 },
      { header: "Work By", key: "work_by", width: 16 },
      { header: "From", key: "from_dt", width: 18 },
      { header: "To", key: "to_dt", width: 18 },
      { header: "Total (Hr.)", key: "total_hr", width: 12 },
      { header: "Brief Description", key: "brief_description", width: 40 },
      { header: "Production Action", key: "production_action", width: 40 },
      { header: "Corrective", key: "corrective", width: 40 },
      { header: "Result", key: "result", width: 40 },
      { header: "Approve By", key: "approve_by", width: 16 },
    ];

    // คอลัมน์ cause_* (หัวข้อ)
    const causeCols = [
      { header: "CM_NotUnderstand", key: "cm_not_understand", width: 20 },
      { header: "CM_NotChecking", key: "cm_not_checking", width: 20 },
      { header: "CM_Absent", key: "cm_absent", width: 20 },
      { header: "CM_NotCarefully", key: "cm_not_carefully", width: 20 },
      { header: "CM_RepairError", key: "cm_repair_error", width: 20 },
      { header: "MC_Production", key: "mc_production", width: 20 },
      { header: "MC_OperateError", key: "mc_operate_error", width: 20 },
      { header: "MC_DesignError", key: "mc_design_error", width: 20 },
      { header: "MC_QualityFail", key: "mc_quality_fail", width: 20 },
      { header: "MC_Inappropriate", key: "mc_inappropriate", width: 20 },
      { header: "MC_NotLubricant", key: "mc_not_lubricant", width: 20 },
      { header: "MC_Loosen", key: "mc_loosen", width: 20 },
      { header: "SP_SpareDamage", key: "sp_spare_damage", width: 20 },
      { header: "SP_ProductSpareError", key: "sp_product_spare_error", width: 25 },
      { header: "PP_Dirty", key: "pp_dirty", width: 20 },
      { header: "PP_HighTemp", key: "pp_high_temp", width: 20 },
      { header: "PP_WaterLeak", key: "pp_water_leak", width: 20 },
      { header: "PP_ChemicalGas", key: "pp_chemical_gas", width: 25 },
      { header: "Cause Member Mode", key: "cause_member_mode", width: 20 },
    ];

    // คอลัมน์อะไหล่
    const spareCols = [];
    for (let i = 1; i <= MAX_SPARES; i++) {
      spareCols.push(
        { header: `SP${i}_Name`, key: `sp${i}_name`, width: 20 },
        { header: `SP${i}_Model`, key: `sp${i}_model`, width: 16 },
        { header: `SP${i}_Maker`, key: `sp${i}_maker`, width: 16 },
        { header: `SP${i}_Qty`, key: `sp${i}_qty`, width: 10 },
      );
    }

    ws.columns = [...baseCols, ...causeCols, ...spareCols];

    // เติมข้อมูล
    rows.forEach((r) => {
      const cm = safe(r.cause_member);
      const mc = safe(r.cause_machine);
      const sp = safe(r.cause_spare);
      const pp = safe(r.cause_product_process);

      const rowData = {
        // base
        id: r.id,
        createdAt: r.createdAt ? new Date(r.createdAt).toISOString().slice(0, 19).replace("T", " ") : "",
        date: r.date || "",
        time: r.time || "",
        machine_request_name: r.machine_request_name || "",
        machine_name: r.machine_name || "",
        machine_no: r.machine_no || "",
        machine_status: r.machine_status || "",
        request_status: r.request_status || "",
        receive_by: r.receive_by || "",
        receive_time: r.receive_time || "",
        work_by: r.work_by || "",
        from_dt: `${r.from_date || ""} ${r.from_time || ""}`.trim(),
        to_dt: `${r.to_date || ""} ${r.to_time || ""}`.trim(),
        total_hr: r.total_hr || "",
        brief_description: r.brief_description || "",
        production_action: r.production_action || "",
        corrective: r.corrective || "",
        result: r.result || "",
        approve_by: r.approve_by || "",

        // causes → แสดงข้อความแทน 1/0
        cm_not_understand: labelIf(cm.not_understand, "ไม่เข้าใจ (Not Understand)"),
        cm_not_checking: labelIf(cm.not_checking, " ไม่ตรวจเช็ค (Not Checking)"),
        cm_absent: labelIf(cm.absent, "ขาดงาน (Absent)"),
        cm_not_carefully: labelIf(cm.not_carefully, "ทำด้วยไม่ถี่ถ้วน (Not Carefully)"),
        cm_repair_error: labelIf(cm.repair_error, "ทำไม่ดี Repair Error"),

        mc_production: labelIf(mc.production, "Production"),
        mc_operate_error: labelIf(mc.operate_error, "Operate Error"),
        mc_design_error: labelIf(mc.design_error, "ออกแบบไม่ดี (Design Error)"),
        mc_quality_fail: labelIf(mc.quality_fail, "Quality Fail"),
        mc_inappropriate: labelIf(mc.inappropriate, "ไม่เหมาะสมกับงาน (Inappropriate)"),
        mc_not_lubricant: labelIf(mc.not_lubricant, "ขาดการหล่อลื่น (Not Lubricant)"),
        mc_loosen: labelIf(mc.loosen, " หลวม คลอน คาย (Loosen)"),

        sp_spare_damage: labelIf(sp.spare_damage, "ชิ้นส่วนเสียหาย (Spare Damage)"),
        sp_product_spare_error: labelIf(sp.product_spare_error, "Product Spare Error"),

        pp_dirty: labelIf(pp.dirty, "สกปรก (Dirty)"),
        pp_high_temp: labelIf(pp.high_temp, "อุณหภูมิสูง (High Temp)"),
        pp_water_leak: labelIf(pp.water_leak, "น้ำรั่ว (Water Leak)"),
        pp_chemical_gas: labelIf(pp.chemical_gas, "สารเคมี/แก๊ส (Chemical Gas)"),

        cause_member_mode: r.cause_member_mode || "",
      };

      // เติม spare parts
      const parts = Array.isArray(r.spare_parts) ? r.spare_parts : [];
      for (let i = 1; i <= MAX_SPARES; i++) {
        const it = parts[i - 1] || {};
        rowData[`sp${i}_name`] = it.name || "";
        rowData[`sp${i}_model`] = it.model || "";
        rowData[`sp${i}_maker`] = it.maker || "";
        rowData[`sp${i}_qty`] = it.qty ?? "";
      }

      ws.addRow(rowData);
    });

    // ส่งไฟล์
    const filename = `maintenance_${new Date().toISOString().slice(0, 10)}.xlsx`;
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("EXPORT error:", err);
    res.status(500).json({ message: "Export ไม่สำเร็จ" });
  }
});


app.get("/export1", async (req, res) => {
  try {
    const { startDate, endDate, status = "finished", location } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: "startDate/endDate required" });
    }

    const start = new Date(`${startDate}T00:00:00.000Z`);
    const end = new Date(`${endDate}T23:59:59.999Z`);

    const raw = Maintenance.getAttributes();
    const createdCol =
      raw.createdAt ? "createdAt" :
        raw.created_at ? "created_at" :
          null;

    if (!createdCol) {
      return res.status(500).json({ message: "Model has no createdAt/created_at column" });
    }

    // ✅ ใช้ Op.between ตรง ๆ เลย
    const where = {
      request_status: status,
      [createdCol]: { [Op.between]: [start, end] },
    };

    // ✅ เพิ่มเงื่อนไขถ้ามี location และไม่ใช่ "ALL"
    if (location && location !== "ALL") {
      where.Location_Name = location;
    }

    console.log("[/Maintenance/export1] where =", {
      status,
      location,
      start: start.toISOString(),
      end: end.toISOString(),
      createdCol
    });

    const rows = await Maintenance.findAll({
      where,
      order: [[createdCol, "DESC"]],
    });

    // ---------------- Excel ----------------
    const ExcelJS = require("exceljs");
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Maintenance");

    const safe = (obj) => obj || {};
    const MAX_SPARES = 8;
    const labelIf = (flag, label) => (flag ? label : "");

    const baseCols = [
      { header: "ID", key: "id", width: 8 },
      { header: "Created At", key: "createdAt", width: 20 },
      { header: "Date", key: "date", width: 12 },
      { header: "Time", key: "time", width: 10 },
      { header: "Machine", key: "machine_request_name", width: 25 },
      { header: "Machine Name", key: "machine_name", width: 18 },
      { header: "Machine No", key: "machine_no", width: 12 },
      { header: "Status MC", key: "machine_status", width: 18 },
      { header: "Request Status", key: "request_status", width: 16 },
      { header: "Receive By", key: "receive_by", width: 16 },
      { header: "Receive Time", key: "receive_time", width: 12 },
      { header: "Work By", key: "work_by", width: 16 },
      { header: "From", key: "from_dt", width: 18 },
      { header: "To", key: "to_dt", width: 18 },
      { header: "Total (Hr.)", key: "total_hr", width: 12 },
      { header: "Brief Description", key: "brief_description", width: 40 },
      { header: "Production Action", key: "production_action", width: 40 },
      { header: "Corrective", key: "corrective", width: 40 },
      { header: "Result", key: "result", width: 40 },
      { header: "Approve By", key: "approve_by", width: 16 },
    ];

    const causeCols = [
      { header: "CM_NotUnderstand", key: "cm_not_understand", width: 20 },
      { header: "CM_NotChecking", key: "cm_not_checking", width: 20 },
      { header: "CM_Absent", key: "cm_absent", width: 20 },
      { header: "CM_NotCarefully", key: "cm_not_carefully", width: 20 },
      { header: "CM_RepairError", key: "cm_repair_error", width: 20 },
      { header: "MC_Production", key: "mc_production", width: 20 },
      { header: "MC_OperateError", key: "mc_operate_error", width: 20 },
      { header: "MC_DesignError", key: "mc_design_error", width: 20 },
      { header: "MC_QualityFail", key: "mc_quality_fail", width: 20 },
      { header: "MC_Inappropriate", key: "mc_inappropriate", width: 20 },
      { header: "MC_NotLubricant", key: "mc_not_lubricant", width: 20 },
      { header: "MC_Loosen", key: "mc_loosen", width: 20 },
      { header: "SP_SpareDamage", key: "sp_spare_damage", width: 20 },
      { header: "SP_ProductSpareError", key: "sp_product_spare_error", width: 25 },
      { header: "PP_Dirty", key: "pp_dirty", width: 20 },
      { header: "PP_HighTemp", key: "pp_high_temp", width: 20 },
      { header: "PP_WaterLeak", key: "pp_water_leak", width: 20 },
      { header: "PP_ChemicalGas", key: "pp_chemical_gas", width: 25 },
      { header: "Cause Member Mode", key: "cause_member_mode", width: 20 },
    ];

    const spareCols = [];
    for (let i = 1; i <= MAX_SPARES; i++) {
      spareCols.push(
        { header: `SP${i}_Name`, key: `sp${i}_name`, width: 20 },
        { header: `SP${i}_Model`, key: `sp${i}_model`, width: 16 },
        { header: `SP${i}_Maker`, key: `sp${i}_maker`, width: 16 },
        { header: `SP${i}_Qty`, key: `sp${i}_qty`, width: 10 },
        { header: `SP${i}_Unit`, key: `sp${i}_unit`, width: 10 },
      );
    }

    ws.columns = [...baseCols, ...causeCols, ...spareCols];

    rows.forEach((r) => {
      const cm = safe(r.cause_member);
      const mc = safe(r.cause_machine);
      const sp = safe(r.cause_spare);
      const pp = safe(r.cause_product_process);

      const rowData = {
        id: r.id,
        createdAt: r[createdCol] ? new Date(r[createdCol]).toISOString().slice(0, 19).replace("T", " ") : "",
        date: r.date || "",
        time: r.time || "",
        machine_request_name: r.machine_request_name || "",
        machine_name: r.machine_name || "",
        machine_no: r.machine_no || "",
        machine_status: r.machine_status || "",
        request_status: r.request_status || "",
        receive_by: r.receive_by || "",
        receive_time: r.receive_time || "",
        work_by: r.work_by || "",
        from_dt: `${r.from_date || ""} ${r.from_time || ""}`.trim(),
        to_dt: `${r.to_date || ""} ${r.to_time || ""}`.trim(),
        total_hr: r.total_hr || "",
        brief_description: r.brief_description || "",
        production_action: r.production_action || "",
        corrective: r.corrective || "",
        result: r.result || "",
        approve_by: r.approve_by || "",

        // causes
        cm_not_understand: labelIf(cm.not_understand, "ไม่เข้าใจ (Not Understand)"),
        cm_not_checking: labelIf(cm.not_checking, "ไม่ตรวจเช็ค (Not Checking)"),
        cm_absent: labelIf(cm.absent, "ขาดงาน (Absent)"),
        cm_not_carefully: labelIf(cm.not_carefully, "ทำด้วยไม่ถี่ถ้วน (Not Carefully)"),
        cm_repair_error: labelIf(cm.repair_error, "ทำไม่ดี Repair Error"),

        mc_production: labelIf(mc.production, "Production"),
        mc_operate_error: labelIf(mc.operate_error, "Operate Error"),
        mc_design_error: labelIf(mc.design_error, "ออกแบบไม่ดี (Design Error)"),
        mc_quality_fail: labelIf(mc.quality_fail, "Quality Fail"),
        mc_inappropriate: labelIf(mc.inappropriate, "ไม่เหมาะสมกับงาน (Inappropriate)"),
        mc_not_lubricant: labelIf(mc.not_lubricant, "ขาดการหล่อลื่น (Not Lubricant)"),
        mc_loosen: labelIf(mc.loosen, "หลวม คลอน คาย (Loosen)"),

        sp_spare_damage: labelIf(sp.spare_damage, "ชิ้นส่วนเสียหาย (Spare Damage)"),
        sp_product_spare_error: labelIf(sp.product_spare_error, "Product Spare Error"),

        pp_dirty: labelIf(pp.dirty, "สกปรก (Dirty)"),
        pp_high_temp: labelIf(pp.high_temp, "อุณหภูมิสูง (High Temp)"),
        pp_water_leak: labelIf(pp.water_leak, "น้ำรั่ว (Water Leak)"),
        pp_chemical_gas: labelIf(pp.chemical_gas, "สารเคมี/แก๊ส (Chemical Gas)"),

        cause_member_mode: r.cause_member_mode || "",
      };

      const parts = Array.isArray(r.spare_parts) ? r.spare_parts : [];
      for (let i = 1; i <= MAX_SPARES; i++) {
        const it = parts[i - 1] || {};
        rowData[`sp${i}_name`] = it.name || "";
        rowData[`sp${i}_model`] = it.model || "";
        rowData[`sp${i}_maker`] = it.maker || "";
        rowData[`sp${i}_qty`] = it.qty ?? "";
        rowData[`sp${i}_unit`] = it.unit ?? "";
      }

      ws.addRow(rowData);
    });

    const fname = `maintenance_${startDate}_to_${endDate}_FINISHED.xlsx`;
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${fname}"`);
    await wb.xlsx.write(res);
    res.end();

  } catch (err) {
    const detail =
      err?.original?.detail ||
      err?.original?.message ||
      err?.parent?.detail ||
      err?.parent?.message ||
      err?.message || "unknown";

    console.error("EXPORT DB ERROR name:", err?.name);
    console.error("EXPORT DB ERROR message:", err?.message);
    console.error("EXPORT DB ERROR detail:", detail);
    if (err?.sql) console.error("EXPORT DB SQL:", err.sql);

    res.setHeader("X-Error-Detail", String(detail));
    res.status(500).json({ message: "Export ไม่สำเร็จ", detail, name: err?.name });
  }
});


// GET /Maintenance/exportByDate?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
app.get('/exportByDate', async (req, res) => {
  try {
    const { startDate, endDate, status = 'finished', location } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Missing startDate or endDate' });
    }

    const start = new Date(`${startDate}T00:00:00.000`);
    const end = new Date(`${endDate}T23:59:59.999`);

    // เงื่อนไข where
    const whereCondition = {
      createdAt: { [Op.between]: [start, end] },
      request_status: status,
    };

    // ✅ ถ้ามีการส่ง location มา และไม่ใช่ "ALL", ค่อยเพิ่มเข้าเงื่อนไข
    if (location && location !== "ALL") {
      whereCondition.Location_Name = location;
    }

    const results = await Maintenance.findAll({
      where: whereCondition,
      order: [['createdAt', 'ASC']],
    });

    res.json(results);
  } catch (error) {
    console.error('❌ Error in /Maintenance/exportByDate:', error);
    res.status(500).json({ error: 'Server error' });
  }
});



app.get('/exportByDateSpare', async (req, res) => {
  try {
    const { startDate, endDate, status = 'finished', location } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Missing startDate or endDate' });
    }

    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T23:59:59`);

    const whereCondition = {
      createdAt: { [Op.between]: [start, end] },
      request_status: status,
    };

    if (location && location !== "ALL") {
      whereCondition.Location_Name = location;
    }

    const results = await Maintenance.findAll({
      where: whereCondition,
      order: [['createdAt', 'ASC']],
    });

    // ✅ กรองเฉพาะที่มี spare_parts จริง
    const filtered = results.filter(r => {
      if (!Array.isArray(r.spare_parts)) return false;
      return r.spare_parts.some(
        sp =>
          sp &&
          (sp.name?.trim() ||
            sp.model?.trim() ||
            sp.maker?.trim() ||
            sp.qty?.trim())
      );
    });

    res.json(filtered);
  } catch (error) {
    console.error('❌ Error in /exportByDateSpare:', error);
    res.status(500).json({ error: 'Server error' });
  }
});




app.get("/:id", async (req, res) => {
  const { id } = req.params;
  const data = await Maintenance.findByPk(id);  // หรือ findOne({ where: { id } })
  if (!data) return res.status(404).send("Not Found");
  res.json(data);
});

app.put('/update/:id', async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  try {
    await Maintenance.update(updateData, { where: { id } });

    const updated = await Maintenance.findByPk(id);  // 👈 เพิ่มบรรทัดนี้

    // ⬇️ Emit update
    const io = req.app.get('io');
    io.emit('maintenance:update', updated.get({ plain: true }));

    res.json({ message: "Update successful" });
  } catch (error) {
    console.error("Update failed:", error);
    res.status(500).json({ error: "Update failed" });
  }
});

app.put('/updateRequestToPro/:id', async (req, res) => {
  const { id } = req.params;
  const {
    cause_member_mode,
    cause_member,
    cause_machine,
    cause_spare,
    cause_product_process,
    corrective,
    result,
    spare_parts,
    control,
    approve_by,
    work_by,         // ✅ เพิ่ม
    from_date,       // ✅ เพิ่ม
    from_time,       // ✅ เพิ่ม
    to_date,         // ✅ เพิ่ม
    to_time,         // ✅ เพิ่ม
    total_hr,        // ✅ เพิ่ม
    request_status, // ✅ ดึงมาจาก body

    Worker_Code_1,
    Worker_Name_1,
    Work_Start_Date,
    Work_Start_Time,
    Work_End_Date,
    Work_End_Time,
    Work_Total_Time,
    Remark,

  } = req.body;

  try {
    await Maintenance.update({
      cause_member_mode,
      cause_member,
      cause_machine,
      cause_spare,
      cause_product_process,
      corrective,
      result,
      spare_parts,
      control,
      approve_by,
      work_by,         // ✅ เพิ่ม
      from_date,       // ✅ เพิ่ม
      from_time,       // ✅ เพิ่ม
      to_date,         // ✅ เพิ่ม
      to_time,         // ✅ เพิ่ม
      total_hr,         // ✅ เพิ่ม
      request_status, // ✅ ดึงมาจาก body

      Worker_Code_1,
      Worker_Name_1,
      Work_Start_Date,
      Work_Start_Time,
      Work_End_Date,
      Work_End_Time,
      Work_Total_Time,
      Remark,
    }, {
      where: { id }
    });

    const updated = await Maintenance.findByPk(id);  // 👈 เพิ่ม

    const io = req.app.get('io');
    io.emit('maintenance:update', updated.get({ plain: true }));


    res.json({ success: true });
  } catch (error) {
    console.error("Error updating request:", error);
    res.status(500).json({ success: false, message: "Update failed" });
  }
});
app.put('/updateRequestToProSetting/:id', async (req, res) => {
  const { id } = req.params;
  const {

    time,
    date,
    requestor_name,
    shift,
    section,
    shift_leader,
    machine_name,
    machine_no,
    machine_request_name,
    Machine_No,
    machine_stop_time,

    Location_Name,
    machine_status,
    brief_description,
    production_action,

    receive_time,

    cause_member_mode,
    cause_member,
    cause_machine,
    cause_spare,
    cause_product_process,

    corrective,
    result,
    spare_parts,
    control,
    approve_by,
    work_by,         // ✅ เพิ่ม
    from_date,       // ✅ เพิ่ม
    from_time,       // ✅ เพิ่ม
    to_date,         // ✅ เพิ่ม
    to_time,         // ✅ เพิ่ม
    total_hr,        // ✅ เพิ่ม
    request_status, // ✅ ดึงมาจาก body

    Worker_Code_1,
    Worker_Name_1,
    Work_Start_Date,
    Work_Start_Time,
    Work_End_Date,
    Work_End_Time,
    Work_Total_Time,
    Remark,

  } = req.body;

  try {
    await Maintenance.update({

      time,
      date,
      requestor_name,
      shift,
      section,
      shift_leader,
      machine_name,
      machine_no,
      machine_request_name,
      Machine_No,
      machine_stop_time,

      Location_Name,
      machine_status,
      brief_description,
      production_action,

      receive_time,

      cause_member_mode,
      cause_member,
      cause_machine,
      cause_spare,
      cause_product_process,

      corrective,
      result,
      spare_parts,
      control,
      approve_by,
      work_by,         // ✅ เพิ่ม
      from_date,       // ✅ เพิ่ม
      from_time,       // ✅ เพิ่ม
      to_date,         // ✅ เพิ่ม
      to_time,         // ✅ เพิ่ม
      total_hr,         // ✅ เพิ่ม
      request_status, // ✅ ดึงมาจาก body

      Worker_Code_1,
      Worker_Name_1,
      Work_Start_Date,
      Work_Start_Time,
      Work_End_Date,
      Work_End_Time,
      Work_Total_Time,
      Remark,
    }, {
      where: { id }
    });

    const updated = await Maintenance.findByPk(id);  // 👈 เพิ่ม

    const io = req.app.get('io');
    io.emit('maintenance:update', updated.get({ plain: true }));


    res.json({ success: true });
  } catch (error) {
    console.error("Error updating request:", error);
    res.status(500).json({ success: false, message: "Update failed" });
  }
});

app.put('/updateRequestFinished/:id', async (req, res) => {
  const { id } = req.params;
  const {
    repair_accept_by,
    repair_accept_time,
    pro_receive,

  } = req.body;

  try {
    await Maintenance.update({
      repair_accept_by,
      repair_accept_time,
      pro_receive,

    }, {
      where: { id }
    });

    // 🔁 ดึงข้อมูลใหม่ แล้ว emit ให้ client ทันที
    const updated = await Maintenance.findByPk(id);
    const io = req.app.get('io');
    io.emit('maintenance:update', updated.get({ plain: true }));

    res.json({ success: true });
  } catch (error) {
    console.error("Error updating request:", error);
    res.status(500).json({ success: false, message: "Update failed" });
  }
});

app.put('/updateRequestCancel/:id', async (req, res) => {
  const { id } = req.params;
  const {
    request_status,

  } = req.body;

  try {
    await Maintenance.update({
      request_status,

    }, {
      where: { id }
    });

    // 🔁 ดึงข้อมูลใหม่ แล้ว emit ให้ client ทันที
    const updated = await Maintenance.findByPk(id);
    const io = req.app.get('io');
    io.emit('maintenance:update', updated.get({ plain: true }));

    res.json({ success: true });
  } catch (error) {
    console.error("Error updating request:", error);
    res.status(500).json({ success: false, message: "Update failed" });
  }
});



app.put('/updateRecordApprove/:id', async (req, res) => {
  const { id } = req.params;
  const {
    approve_by,
    Serial_No,

    // cause_member_mode,
    // cause_member,
    // cause_machine,
    // cause_spare,
    // cause_product_process,

    Work_Group_Name,
    Work_Group_Code,
    Work_Type_Name,
    Work_Type_Code,

    // จาก causeFields (สูงสุด 3 causes)
    Cause_1_Code_1,
    Cause_1_Name_1,
    Cause_1_Code_2,
    Cause_1_Name_2,

    Cause_2_Code_1,
    Cause_2_Name_1,
    Cause_2_Code_2,
    Cause_2_Name_2,

    Cause_3_Code_1,
    Cause_3_Name_1,
    Cause_3_Code_2,
    Cause_3_Name_2,
  } = req.body;

  try {
    await Maintenance.update({
      approve_by,
      Serial_No,

      // cause_member_mode,
      // cause_member,
      // cause_machine,
      // cause_spare,
      // cause_product_process,

      Work_Group_Name,
      Work_Group_Code,
      Work_Type_Name,
      Work_Type_Code,

      // เก็บสาเหตุลงคอลัมน์แยก
      Cause_1_Code_1,
      Cause_1_Name_1,
      Cause_1_Code_2,
      Cause_1_Name_2,

      Cause_2_Code_1,
      Cause_2_Name_1,
      Cause_2_Code_2,
      Cause_2_Name_2,

      Cause_3_Code_1,
      Cause_3_Name_1,
      Cause_3_Code_2,
      Cause_3_Name_2,
    }, {
      where: { id }
    });

    // 🔁 ส่งข้อมูลใหม่ออกผ่าน WebSocket
    const updated = await Maintenance.findByPk(id);
    const io = req.app.get('io');
    io.emit('maintenance:update', updated.get({ plain: true }));

    res.json({ success: true });
  } catch (error) {
    console.error("❌ Error updating request:", error);
    res.status(500).json({ success: false, message: "Update failed" });
  }
});

// อัปเดต Remark in progress
app.put('/updateRemarkInProgress/:id', async (req, res) => {
  const { id } = req.params;
  let { remark_in_progress } = req.body;

  try {
    // กันค่าว่าง + ทำเป็น UPPERCASE + ตัดช่องว่างหัวท้าย
    remark_in_progress = (remark_in_progress ?? '').toString().trim().toUpperCase();
    if (!remark_in_progress) {
      return res.status(400).json({ success: false, message: 'remark_in_progress is required' });
    }

    // อัปเดต
    const [affected] = await Maintenance.update(
      { remark_in_progress },
      { where: { id } }
    );

    if (!affected) {
      return res.status(404).json({ success: false, message: 'record not found' });
    }

    // 🔁 ดึงข้อมูลใหม่ แล้ว emit ให้ client ทันที
    const updated = await Maintenance.findByPk(id);
    const io = req.app.get('io');
    if (io) io.emit('maintenance:update', updated.get({ plain: true }));

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating remark_in_progress:', error);
    res.status(500).json({ success: false, message: 'Update failed' });
  }
});

// ลบรายการ Maintenance ตาม id
app.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Maintenance.destroy({ where: { id } });

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'record not found' });
    }

    // แจ้ง client อื่น ๆ ให้ลบออกด้วย (ถ้าคุณมี socket)
    const io = req.app.get('io');
    if (io) io.emit('maintenance:delete', { id: Number(id) });

    return res.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    return res.status(500).json({ success: false, message: 'Delete failed' });
  }
});





module.exports = app;