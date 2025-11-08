const express = require("express");
const app = express();
const MasterList = require("../models/MasterItemListModel");


// POST: เพิ่ม spare part
app.post('/', async (req, res) => {
    try {
        const {
            Country_Code, Country_Name, Company_Code, Company_Name,
            Place_Code, Place_Name, Section_Code, Section_Name,
            Machine_No, Process_Group_Code, Process_Group_Name,
            Process_Code, Process_Name
        } = req.body;
        const newMasterList = await MasterList.create({
            Country_Code, Country_Name, Company_Code, Company_Name,
            Place_Code, Place_Name, Section_Code, Section_Name,
            Machine_No, Process_Group_Code, Process_Group_Name,
            Process_Code, Process_Name
        });
        res.status(201).json(newMasterList);
    } catch (err) {
        res.status(500).json({ error: 'Failed to add spare part' });
    }
});

app.get("/", async (_req, res) => {
  try {
    const list = await MasterList.findAll({
    //   where: { isActive: true },
      order: [["id", "ASC"]],
    });
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "ดึงรายการเครื่องล้มเหลว" });
  }
});

app.get('/by-machine/:machine_name', async (req, res) => {
  try {
    const { machine_name } = req.params;
    console.log("🔍 Looking for Machine_No:", machine_name);  // ✅ ตรงนี้จะช่วย debug

    const result = await MasterList.findOne({
      where: { Machine_No: machine_name }  // <-- ตรวจจาก Machine_No ใน DB
    });

    if (!result) return res.status(404).json({ error: "Not found" });
    res.json(result);
  } catch (err) {
    console.error("Error fetching machine metadata:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT: แก้ไข spare part
app.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
         Country_Code, Country_Name, Company_Code, Company_Name,
            Place_Code, Place_Name, Section_Code, Section_Name,
            Machine_No, Process_Group_Code, Process_Group_Name,
            Process_Code, Process_Name
        }= req.body;

    await MasterList.update({ 
        Country_Code, Country_Name, Company_Code, Company_Name,
            Place_Code, Place_Name, Section_Code, Section_Name,
            Machine_No, Process_Group_Code, Process_Group_Name,
            Process_Code, Process_Name 
    }, { where: { id } });
    res.status(200).json({ message: 'Spare part updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update spare part' });
  }
});

// DELETE: ลบ spare part
app.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await MasterList.destroy({ where: { id } });
    res.status(200).json({ message: 'Spare part deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete spare part' });
  }
});



module.exports = app;