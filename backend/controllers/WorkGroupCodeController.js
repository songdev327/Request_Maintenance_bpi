const express = require("express");
const app = express();
const WorkGroup = require("../models/WorkGroupCodeModel");


// POST: เพิ่ม spare part
app.post('/', async (req, res) => {
    try {
        const {
            Work_Group_Code, Work_Group_Name, 
            Work_Type_Code, Work_Type_Name,
        } = req.body;
        const newWorkGroup = await WorkGroup.create({
            Work_Group_Code, Work_Group_Name, 
            Work_Type_Code, Work_Type_Name,

        });
        res.status(201).json(newWorkGroup);
    } catch (err) {
        res.status(500).json({ error: 'Failed to add workGroup' });
    }
});

app.get("/", async (_req, res) => {
  try {
    const list = await WorkGroup.findAll({
    //   where: { isActive: true },
      order: [["id", "ASC"]],
    });
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "ดึงรายการเครื่องล้มเหลว" });
  }
});
app.get("/api", async (_req, res) => {
  try {
    const list = await WorkGroup.findAll({
    //   where: { isActive: true },
      order: [["id", "ASC"]],
    });
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "ดึงรายการเครื่องล้มเหลว" });
  }
});

// PUT: แก้ไข spare part
app.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
            Work_Group_Code, Work_Group_Name, 
            Work_Type_Code, Work_Type_Name,
        
        }= req.body;

    await WorkGroup.update({ 
            Work_Group_Code, Work_Group_Name, 
            Work_Type_Code, Work_Type_Name,
         
    }, { where: { id } });
    res.status(200).json({ message: 'updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update spare part' });
  }
});

// DELETE: ลบ spare part
app.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await WorkGroup.destroy({ where: { id } });
    res.status(200).json({ message: 'deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete' });
  }
});



module.exports = app;