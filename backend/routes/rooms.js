const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDB } = require('../models/db');
const router = express.Router();

// 创建房间
router.post('/create', (req, res) => {
  const { brainhole_id, brainhole_title, creator_identity } = req.body;
  const roomId = 'room_' + Math.random().toString(36).substring(2, 10).toUpperCase();
  
  const db = getDB();
  db.run(
    `INSERT INTO rooms (id, brainhole_id, brainhole_title, creator_identity, status) VALUES (?, ?, ?, ?, 'waiting')`,
    [roomId, brainhole_id || '', brainhole_title || '', creator_identity || '匿名用户'],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        db.close();
        return;
      }
      res.json({
        roomId,
        brainhole_id,
        brainhole_title,
        status: 'waiting',
        shareUrl: `${req.protocol}://${req.get('host')}/duo/lobby?room=${roomId}`
      });
      db.close();
    }
  );
});

// 获取房间信息
router.get('/:roomId', (req, res) => {
  const db = getDB();
  db.get(`SELECT * FROM rooms WHERE id = ?`, [req.params.roomId], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      db.close();
      return;
    }
    if (!row) {
      res.status(404).json({ error: '房间不存在' });
      db.close();
      return;
    }
    res.json(row);
    db.close();
  });
});

// 获取房间消息历史
router.get('/:roomId/messages', (req, res) => {
  const db = getDB();
  db.all(
    `SELECT * FROM room_messages WHERE room_id = ? ORDER BY created_at ASC`,
    [req.params.roomId],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        db.close();
        return;
      }
      res.json(rows);
      db.close();
    }
  );
});

// 标记火花
router.post('/:roomId/spark', (req, res) => {
  const { message_id } = req.body;
  const db = getDB();
  db.run(
    `UPDATE room_messages SET is_spark = 1 WHERE id = ? AND room_id = ?`,
    [message_id, req.params.roomId],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        db.close();
        return;
      }
      res.json({ success: true });
      db.close();
    }
  );
});

// 获取火花墙
router.get('/:roomId/sparks', (req, res) => {
  const db = getDB();
  db.all(
    `SELECT * FROM room_messages WHERE room_id = ? AND is_spark = 1 ORDER BY created_at ASC`,
    [req.params.roomId],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        db.close();
        return;
      }
      res.json(rows);
      db.close();
    }
  );
});

// 关闭房间并生成故事
router.post('/:roomId/close', (req, res) => {
  const { story_draft } = req.body;
  const db = getDB();
  db.run(
    `UPDATE rooms SET status = 'closed', closed_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [req.params.roomId],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        db.close();
        return;
      }
      res.json({ success: true, story_draft });
      db.close();
    }
  );
});

module.exports = router;
