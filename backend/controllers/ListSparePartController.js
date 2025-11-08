const express = require("express");
const app = express();
const SparePart = require("../models/ListSparePartModel");


// POST: เพิ่ม spare part
app.post('/', async (req, res) => {
  try {
    const { name_spare, spec_spare, maker_spare, unit_spare } = req.body;
    const newSparePart = await SparePart.create({ name_spare, spec_spare, maker_spare, unit_spare });
    res.status(201).json(newSparePart);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add spare part' });
  }
});

app.get("/", async (_req, res) => {
  try {
    const list = await SparePart.findAll({
    //   where: { isActive: true },
      order: [["id", "ASC"]],
    });
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "ดึงรายการเครื่องล้มเหลว" });
  }
});

// GET: ค้นหา spare part ด้วยชื่อ model
app.get('/search', async (req, res) => {
  try {
    const { model } = req.query;
    const found = await SparePart.findOne({
      where: {
        spec_spare: model
      }
    });

    if (found) {
      res.json(found);
    } else {
      res.status(404).json({ message: "Not found" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Search failed" });
  }
});

// PUT: แก้ไข spare part
app.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name_spare, spec_spare, maker_spare, unit_spare } = req.body;
    await SparePart.update({ name_spare, spec_spare, maker_spare, unit_spare }, { where: { id } });
    res.status(200).json({ message: 'Spare part updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update spare part' });
  }
});

// DELETE: ลบ spare part
app.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await SparePart.destroy({ where: { id } });
    res.status(200).json({ message: 'Spare part deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete spare part' });
  }
});



module.exports = app;