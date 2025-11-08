const express = require("express");
const app = express();
const MachineSerial = require("../models/MachineSerialModel");


// POST: เพิ่ม spare part
app.post('/', async (req, res) => {
    try {
        const {
            Machine_No, Serial_No, 
        } = req.body;
        const newMachineSerial = await MachineSerial.create({
            Machine_No, Serial_No, 
        });
        res.status(201).json(newMachineSerial);
    } catch (err) {
        res.status(500).json({ error: 'Failed to add MachineSerial' });
    }
});

app.get("/", async (_req, res) => {
  try {
    const list = await MachineSerial.findAll({
    //   where: { isActive: true },
      order: [["id", "ASC"]],
    });
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "ดึงรายการเครื่องล้มเหลว" });
  }
});

app.get("/serialGet", async (req, res) => {
  try {
    const whereClause = {};
    if (req.query.machineNo) {
      whereClause.Machine_No = req.query.machineNo;
    }

    const list = await MachineSerial.findAll({
      where: whereClause,
      order: [["id", "ASC"]],
    });

    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "ดึงรายการ machine_serial ล้มเหลว" });
  }
});

// PUT: แก้ไข spare part
app.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
           Machine_No, Serial_No, 
        
        }= req.body;

    await MachineSerial.update({ 
           Machine_No, Serial_No, 
         
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
    await MachineSerial.destroy({ where: { id } });
    res.status(200).json({ message: 'deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete' });
  }
});



module.exports = app;