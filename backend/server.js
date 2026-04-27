const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { WebSocketServer } = require('ws');
const { v4: uuidv4 } = require('uuid');
const db = require('./models/db');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// 初始化数据库
db.init();

// ========== REST API 路由 ==========
app.use('/api/auth', require('./routes/auth'));
app.use('/api/brainholes', require('./routes/brainholes'));
app.use('/api/reactions', require('./routes/reactions'));
app.use('/api/match', require('./routes/match'));

// 房间相关API
app.use('/api/rooms', require('./routes/rooms'));

// 静态文件服务（生产环境）
app.use(express.static(path.join(__dirname, '../frontend/dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// ========== WebSocket 服务器 ==========
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// 房间管理：roomId -> Set of WebSocket clients
const rooms = new Map();

// 用户身份映射：ws -> { roomId, identity }
const clientInfo = new WeakMap();

// AI催化定时器：roomId -> timeoutId
const catalystTimers = new Map();

wss.on('connection', (ws, req) => {
  console.log('🟢 WebSocket 连接建立');

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data);
      handleMessage(ws, msg);
    } catch (err) {
      console.error('消息解析错误:', err);
      ws.send(JSON.stringify({ type: 'error', message: '无效的消息格式' }));
    }
  });

  ws.on('close', () => {
    const info = clientInfo.get(ws);
    if (info) {
      const { roomId, identity } = info;
      const roomClients = rooms.get(roomId);
      if (roomClients) {
        roomClients.delete(ws);
        // 通知其他人有人离开
        broadcast(roomId, {
          type: 'user_left',
          identity,
          message: `${identity} 离开了房间`
        }, ws);
        // 如果房间空了，清理定时器
        if (roomClients.size === 0) {
          rooms.delete(roomId);
          clearCatalystTimer(roomId);
        }
      }
    }
    console.log('🔴 WebSocket 连接关闭');
  });

  ws.on('error', (err) => {
    console.error('WebSocket 错误:', err);
  });
});

// 处理WebSocket消息
function handleMessage(ws, msg) {
  switch (msg.type) {
    case 'join':
      handleJoin(ws, msg);
      break;
    case 'message':
      handleChatMessage(ws, msg);
      break;
    case 'typing':
      handleTyping(ws, msg);
      break;
    case 'request_sparks':
      handleRequestSparks(ws, msg);
      break;
    default:
      ws.send(JSON.stringify({ type: 'error', message: '未知消息类型: ' + msg.type }));
  }
}

// 加入房间
function handleJoin(ws, msg) {
  const { roomId, identity } = msg;
  if (!roomId || !identity) {
    ws.send(JSON.stringify({ type: 'error', message: '缺少 roomId 或 identity' }));
    return;
  }

  // 记录客户端信息
  clientInfo.set(ws, { roomId, identity });

  // 加入房间集合
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Set());
  }
  rooms.get(roomId).add(ws);

  console.log(`👤 ${identity} 加入房间 ${roomId}`);

  // 发送房间历史消息
  const sqlite = db.getDB();
  sqlite.all(
    `SELECT * FROM room_messages WHERE room_id = ? ORDER BY created_at ASC`,
    [roomId],
    (err, rows) => {
      if (!err) {
        ws.send(JSON.stringify({
          type: 'chat_history',
          messages: rows.map(r => ({
            id: r.id,
            identity: r.user_identity,
            content: r.content,
            isSpark: !!r.is_spark,
            time: r.created_at
          }))
        }));
      }
      sqlite.close();
    }
  );

  // 广播用户加入通知
  broadcast(roomId, {
    type: 'user_joined',
    identity,
    message: `${identity} 加入了房间`
  }, ws);

  // 检查房间人数，如果满2人，更新房间状态
  const roomClients = rooms.get(roomId);
  if (roomClients.size >= 2) {
    const sqlite2 = db.getDB();
    sqlite2.run(`UPDATE rooms SET status = 'active' WHERE id = ?`, [roomId]);
    sqlite2.close();
    
    broadcast(roomId, {
      type: 'room_ready',
      message: '房间已满员，可以开始对话了！'
    });
  }

  // 重置AI催化定时器
  resetCatalystTimer(roomId);
}

// 处理聊天消息
function handleChatMessage(ws, msg) {
  const info = clientInfo.get(ws);
  if (!info) return;

  const { roomId, identity } = info;
  const { content } = msg;
  if (!content || !content.trim()) return;

  // 保存到数据库
  const sqlite = db.getDB();
  sqlite.run(
    `INSERT INTO room_messages (room_id, user_identity, content) VALUES (?, ?, ?)`,
    [roomId, identity, content.trim()],
    function(err) {
      if (err) {
        console.error('保存消息失败:', err);
        return;
      }
      const messageId = this.lastID;
      
      // 广播给房间内所有人
      broadcast(roomId, {
        type: 'message',
        id: messageId,
        identity,
        content: content.trim(),
        isSpark: false,
        time: new Date().toISOString()
      });

      sqlite.close();
    }
  );

  // 重置催化定时器
  resetCatalystTimer(roomId);
}

// 处理输入中状态
function handleTyping(ws, msg) {
  const info = clientInfo.get(ws);
  if (!info) return;
  const { roomId, identity } = info;
  broadcast(roomId, {
    type: 'typing',
    identity,
    isTyping: msg.isTyping
  }, ws);
}

// 请求火花墙
function handleRequestSparks(ws, msg) {
  const info = clientInfo.get(ws);
  if (!info) return;
  const { roomId } = info;
  
  const sqlite = db.getDB();
  sqlite.all(
    `SELECT * FROM room_messages WHERE room_id = ? AND is_spark = 1 ORDER BY created_at ASC`,
    [roomId],
    (err, rows) => {
      if (!err) {
        ws.send(JSON.stringify({
          type: 'spark_wall',
          sparks: rows.map(r => ({
            id: r.id,
            identity: r.user_identity,
            content: r.content,
            time: r.created_at
          }))
        }));
      }
      sqlite.close();
    }
  );
}

// 广播消息给房间内所有人（可选排除发送者）
function broadcast(roomId, data, excludeWs = null) {
  const roomClients = rooms.get(roomId);
  if (!roomClients) return;
  
  const msgStr = JSON.stringify(data);
  roomClients.forEach(client => {
    if (client !== excludeWs && client.readyState === 1) { // 1 = OPEN
      client.send(msgStr);
    }
  });
}

// ========== AI催化定时器 ==========
const CATALYST_INTERVAL = 30000; // 30秒
const catalysts = [
  '如果这不是一个假设，而是你们各自的警报，会怎样？',
  '你们两个人的职业，在这个情境下会产生什么冲突或互补？',
  '如果十年后的你们回看这段对话，会觉得遗憾还是庆幸？',
  '试着用对方职业的视角，重新描述这个情境。',
  '如果这个故事要有一个转折，它会发生在什么时候？',
  '你们各自提到的细节中，有没有可以串联起来的线索？',
];

function resetCatalystTimer(roomId) {
  clearCatalystTimer(roomId);
  const timerId = setTimeout(() => {
    sendCatalyst(roomId);
  }, CATALYST_INTERVAL);
  catalystTimers.set(roomId, timerId);
}

function clearCatalystTimer(roomId) {
  const timerId = catalystTimers.get(roomId);
  if (timerId) {
    clearTimeout(timerId);
    catalystTimers.delete(roomId);
  }
}

function sendCatalyst(roomId) {
  const catalyst = catalysts[Math.floor(Math.random() * catalysts.length)];
  broadcast(roomId, {
    type: 'ai_catalyst',
    content: catalyst,
    timestamp: new Date().toISOString()
  });
  // 再次设置定时器（如果仍然没人说话，会继续推送）
  resetCatalystTimer(roomId);
}

// ========== 启动服务器 ==========
server.listen(PORT, () => {
  console.log(`🚀 群像·星火服务器运行在 http://localhost:${PORT}`);
  console.log(`🌐 WebSocket 端点: ws://localhost:${PORT}`);
});
