const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDB } = require('../models/db');
const router = express.Router();

// 提交反应
router.post('/', (req, res) => {
  const { user_id, brainhole_id, identity_label, content, ai_prompts } = req.body;
  const id = uuidv4();
  const db = getDB();
  
  db.run(
    `INSERT INTO reactions (id, user_id, brainhole_id, identity_label, content, ai_prompts) VALUES (?, ?, ?, ?, ?, ?)`,
    [id, user_id, brainhole_id, identity_label, content, ai_prompts || ''],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ 
        id, 
        user_id, 
        brainhole_id, 
        identity_label, 
        content,
        created_at: new Date().toISOString()
      });
    }
  );
  
  db.close();
});

// 获取用户的反应列表
router.get('/user/:user_id', (req, res) => {
  const db = getDB();
  db.all(
    `SELECT r.*, b.title as brainhole_title FROM reactions r 
     LEFT JOIN brainholes b ON r.brainhole_id = b.id 
     WHERE r.user_id = ? ORDER BY r.created_at DESC`,
    [req.params.user_id],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    }
  );
  db.close();
});

module.exports = router;
