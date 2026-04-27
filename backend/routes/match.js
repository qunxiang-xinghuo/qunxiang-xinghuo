const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDB } = require('../models/db');
const router = express.Router();

// 进入匹配池
router.post('/join', (req, res) => {
  const { user_id, brainhole_id } = req.body;
  const id = uuidv4();
  const db = getDB();
  
  // 先检查是否有人正在等待匹配同一个脑洞
  db.get(
    `SELECT * FROM match_pool WHERE brainhole_id = ? AND status = 'waiting' AND user_id != ? ORDER BY created_at ASC LIMIT 1`,
    [brainhole_id, user_id],
    (err, row) => {
      if (err) {
        res.status(500).json({ error: err.message });
        db.close();
        return;
      }
      
      if (row) {
        // 匹配成功
        db.run(`UPDATE match_pool SET status = 'matched', matched_user_id = ? WHERE id = ?`, [user_id, row.id], function(err) {
          if (err) {
            res.status(500).json({ error: err.message });
            db.close();
            return;
          }
          res.json({ matched: true, match_id: row.id, partner_id: row.user_id });
          db.close();
        });
      } else {
        // 进入等待队列
        db.run(
          `INSERT INTO match_pool (id, user_id, brainhole_id) VALUES (?, ?, ?)`,
          [id, user_id, brainhole_id],
          function(err) {
            if (err) {
              res.status(500).json({ error: err.message });
              db.close();
              return;
            }
            res.json({ matched: false, pool_id: id });
            db.close();
          }
        );
      }
    }
  );
});

// 检查匹配状态
router.get('/status/:pool_id', (req, res) => {
  const db = getDB();
  db.get(`SELECT * FROM match_pool WHERE id = ?`, [req.params.pool_id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      db.close();
      return;
    }
    res.json(row || { status: 'not_found' });
    db.close();
  });
});

module.exports = router;
