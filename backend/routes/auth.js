const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDB } = require('../models/db');
const router = express.Router();

// 创建/更新用户
router.post('/user', (req, res) => {
  const { name, identity_type, identity_label } = req.body;
  const id = uuidv4();
  const db = getDB();
  
  db.run(
    `INSERT INTO users (id, name, identity_type, identity_label) VALUES (?, ?, ?, ?)`,
    [id, name || '匿名用户', identity_type, identity_label],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id, name: name || '匿名用户', identity_type, identity_label });
    }
  );
  
  db.close();
});

// 获取用户
router.get('/user/:id', (req, res) => {
  const db = getDB();
  db.get(`SELECT * FROM users WHERE id = ?`, [req.params.id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(row || null);
  });
  db.close();
});

module.exports = router;
