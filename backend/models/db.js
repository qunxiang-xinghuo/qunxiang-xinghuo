const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/xinghuo.db');

function getDB() {
  return new sqlite3.Database(DB_PATH);
}

function init() {
  const db = getDB();
  
  db.serialize(() => {
    // 用户表
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      zhihu_id TEXT UNIQUE,
      name TEXT,
      avatar TEXT,
      identity_type TEXT,
      identity_label TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // 脑洞表
    db.run(`CREATE TABLE IF NOT EXISTS brainholes (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT,
      source TEXT,
      source_url TEXT,
      liked INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // 反应记录表（单人模式）
    db.run(`CREATE TABLE IF NOT EXISTS reactions (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      brainhole_id TEXT,
      identity_label TEXT,
      content TEXT NOT NULL,
      ai_prompts TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    // 匹配池（保留）
    db.run(`CREATE TABLE IF NOT EXISTS match_pool (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      brainhole_id TEXT,
      status TEXT DEFAULT 'waiting',
      matched_user_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // ========== V2.0 新增：房间表 ==========
    db.run(`CREATE TABLE IF NOT EXISTS rooms (
      id TEXT PRIMARY KEY,
      brainhole_id TEXT,
      brainhole_title TEXT,
      creator_identity TEXT,
      partner_identity TEXT,
      status TEXT DEFAULT 'waiting',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      closed_at DATETIME
    )`);

    // ========== V2.0 新增：房间消息表 ==========
    db.run(`CREATE TABLE IF NOT EXISTS room_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id TEXT NOT NULL,
      user_identity TEXT NOT NULL,
      content TEXT NOT NULL,
      is_spark INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (room_id) REFERENCES rooms(id)
    )`);

    console.log('✅ 数据库初始化完成（含V2.0房间系统）');
  });

  db.close();
}

module.exports = { getDB, init };
