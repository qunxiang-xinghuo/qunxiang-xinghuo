const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDB } = require('../models/db');
const router = express.Router();

// 模拟脑洞数据（MVP阶段，后续对接知乎搜索API）
const mockBrainholes = [
  {
    id: 'bh_1',
    title: '如果你突然拥有了读心术，但只能读取陌生人的想法，你会怎么利用它？',
    content: '每天早上挤地铁的时候，耳边会响起几百个陌生人的心声...',
    source: '知乎',
    source_url: 'https://zhihu.com/question/xxx'
  },
  {
    id: 'bh_2',
    title: '作为一个外卖员，你见过最让你难忘的一单是什么？',
    content: '深夜十一点，订单备注写着：不用敲门，放在门口就好，谢谢你还这么晚送餐。',
    source: '知乎',
    source_url: 'https://zhihu.com/question/xxx'
  },
  {
    id: 'bh_3',
    title: '如果你能和五年前的自己通话一分钟，你会说什么？',
    content: '只有一分钟，时间一到自动挂断...',
    source: '知乎',
    source_url: 'https://zhihu.com/question/xxx'
  },
  {
    id: 'bh_4',
    title: '作为医生，有没有哪个瞬间让你觉得"这个职业值了"？',
    content: '抢救了三个小时，心电图终于出现规律的波形...',
    source: '知乎',
    source_url: 'https://zhihu.com/question/xxx'
  },
  {
    id: 'bh_5',
    title: '如果你的宠物突然开口说话了，你觉得它第一句话会是什么？',
    content: '养了十年的老猫，在一个雷雨夜突然看着你说...',
    source: '知乎',
    source_url: 'https://zhihu.com/question/xxx'
  }
];

// 获取脑洞列表
router.get('/', (req, res) => {
  const db = getDB();
  db.all(`SELECT * FROM brainholes ORDER BY created_at DESC LIMIT 20`, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    // 如果数据库为空，返回模拟数据
    if (rows.length === 0) {
      res.json(mockBrainholes);
      return;
    }
    res.json(rows);
  });
  db.close();
});

// 收藏脑洞
router.post('/:id/like', (req, res) => {
  const db = getDB();
  db.run(`UPDATE brainholes SET liked = 1 WHERE id = ?`, [req.params.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ success: true });
  });
  db.close();
});

module.exports = router;
