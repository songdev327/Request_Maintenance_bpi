// controllers/MenuController.js
const express = require('express');
const app = express();
const fs = require('fs');
const path = require('path');

// GET /menu → ส่งเมนูจาก menu.json
app.get('/', (req, res) => {
  const menuPath = path.join(__dirname, '../data/menu.json');
  fs.readFile(menuPath, 'utf-8', (err, data) => {
    if (err) {
      console.error("❌ Error reading menu.json:", err);
      return res.status(500).json({ error: 'Failed to load menu.json' });
    }
    try {
      res.json(JSON.parse(data));
    } catch (parseErr) {
      console.error("❌ Error parsing menu.json:", parseErr);
      res.status(500).json({ error: 'Invalid JSON format in menu.json' });
    }
  });
});

module.exports = app;
