const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { WebSocketServer } = require('ws');
const { v4: uuidv4 } = require('uuid');
const db = require('/opt/render/project/src/backend/models/db');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// 鍒濆鍖栨暟鎹簱锛堝け璐ヤ笉闃诲鏈嶅姟鍚姩锛?try {
  db.init();
} catch (err) {
  console.error('鈿狅笍 鏁版嵁搴撳垵濮嬪寲澶辫触锛屽皢浠ュ唴瀛樻ā寮忚繍琛?', err.message);
}

// ========== REST API 璺敱 ==========
app.use('/api/auth', require('/opt/render/project/src/backend/routes/auth'));
app.use('/api/brainholes', require('/opt/render/project/src/backend/routes/brainholes'));
app.use('/api/reactions', require('/opt/render/project/src/backend/routes/reactions'));
app.use('/api/match', require('/opt/render/project/src/backend/routes/match'));

// 鎴块棿鐩稿叧API
app.use('/api/rooms', require('/opt/render/project/src/backend/routes/rooms'));

// 闈欐€佹枃浠舵湇鍔★紙鐢熶骇鐜锛?app.use(express.static(path.join(__dirname, '../frontend/dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// ========== WebSocket 鏈嶅姟鍣?==========
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// 鎴块棿绠＄悊锛歳oomId -> Set of WebSocket clients
const rooms = new Map();

// 鐢ㄦ埛韬唤鏄犲皠锛歸s -> { roomId, identity }
const clientInfo = new WeakMap();

// AI鍌寲瀹氭椂鍣細roomId -> timeoutId
const catalystTimers = new Map();

wss.on('connection', (ws, req) => {
  console.log('馃煝 WebSocket 杩炴帴寤虹珛');

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data);
      handleMessage(ws, msg);
    } catch (err) {
      console.error('娑堟伅瑙ｆ瀽閿欒:', err);
      ws.send(JSON.stringify({ type: 'error', message: '鏃犳晥鐨勬秷鎭牸寮? }));
    }
  });

  ws.on('close', () => {
    const info = clientInfo.get(ws);
    if (info) {
      const { roomId, identity } = info;
      const roomClients = rooms.get(roomId);
      if (roomClients) {
        roomClients.delete(ws);
        // 閫氱煡鍏朵粬浜烘湁浜虹寮€
        broadcast(roomId, {
          type: 'user_left',
          identity,
          message: `${identity} 绂诲紑浜嗘埧闂碻
        }, ws);
        // 濡傛灉鎴块棿绌轰簡锛屾竻鐞嗗畾鏃跺櫒
        if (roomClients.size === 0) {
          rooms.delete(roomId);
          clearCatalystTimer(roomId);
        }
      }
    }
    console.log('馃敶 WebSocket 杩炴帴鍏抽棴');
  });

  ws.on('error', (err) => {
    console.error('WebSocket 閿欒:', err);
  });
});

// 澶勭悊WebSocket娑堟伅
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
      ws.send(JSON.stringify({ type: 'error', message: '鏈煡娑堟伅绫诲瀷: ' + msg.type }));
  }
}

// 鍔犲叆鎴块棿
function handleJoin(ws, msg) {
  const { roomId, identity } = msg;
  if (!roomId || !identity) {
    ws.send(JSON.stringify({ type: 'error', message: '缂哄皯 roomId 鎴?identity' }));
    return;
  }

  // 璁板綍瀹㈡埛绔俊鎭?  clientInfo.set(ws, { roomId, identity });

  // 鍔犲叆鎴块棿闆嗗悎
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Set());
  }
  rooms.get(roomId).add(ws);

  console.log(`馃懁 ${identity} 鍔犲叆鎴块棿 ${roomId}`);

  // 鍙戦€佹埧闂村巻鍙叉秷鎭?  const sqlite = db.getDB();
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

  // 骞挎挱鐢ㄦ埛鍔犲叆閫氱煡
  broadcast(roomId, {
    type: 'user_joined',
    identity,
    message: `${identity} 鍔犲叆浜嗘埧闂碻
  }, ws);

  // 妫€鏌ユ埧闂翠汉鏁帮紝濡傛灉婊?浜猴紝鏇存柊鎴块棿鐘舵€?  const roomClients = rooms.get(roomId);
  if (roomClients.size >= 2) {
    const sqlite2 = db.getDB();
    sqlite2.run(`UPDATE rooms SET status = 'active' WHERE id = ?`, [roomId]);
    sqlite2.close();
    
    broadcast(roomId, {
      type: 'room_ready',
      message: '鎴块棿宸叉弧鍛橈紝鍙互寮€濮嬪璇濅簡锛?
    });
  }

  // 閲嶇疆AI鍌寲瀹氭椂鍣?  resetCatalystTimer(roomId);
}

// 澶勭悊鑱婂ぉ娑堟伅
function handleChatMessage(ws, msg) {
  const info = clientInfo.get(ws);
  if (!info) return;

  const { roomId, identity } = info;
  const { content } = msg;
  if (!content || !content.trim()) return;

  // 淇濆瓨鍒版暟鎹簱
  const sqlite = db.getDB();
  sqlite.run(
    `INSERT INTO room_messages (room_id, user_identity, content) VALUES (?, ?, ?)`,
    [roomId, identity, content.trim()],
    function(err) {
      if (err) {
        console.error('淇濆瓨娑堟伅澶辫触:', err);
        return;
      }
      const messageId = this.lastID;
      
      // 骞挎挱缁欐埧闂村唴鎵€鏈変汉
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

  // 閲嶇疆鍌寲瀹氭椂鍣?  resetCatalystTimer(roomId);
}

// 澶勭悊杈撳叆涓姸鎬?function handleTyping(ws, msg) {
  const info = clientInfo.get(ws);
  if (!info) return;
  const { roomId, identity } = info;
  broadcast(roomId, {
    type: 'typing',
    identity,
    isTyping: msg.isTyping
  }, ws);
}

// 璇锋眰鐏姳澧?function handleRequestSparks(ws, msg) {
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

// 骞挎挱娑堟伅缁欐埧闂村唴鎵€鏈変汉锛堝彲閫夋帓闄ゅ彂閫佽€咃級
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

// ========== AI鍌寲瀹氭椂鍣?==========
const CATALYST_INTERVAL = 30000; // 30绉?const catalysts = [
  '濡傛灉杩欎笉鏄竴涓亣璁撅紝鑰屾槸浣犱滑鍚勮嚜鐨勮鎶ワ紝浼氭€庢牱锛?,
  '浣犱滑涓や釜浜虹殑鑱屼笟锛屽湪杩欎釜鎯呭涓嬩細浜х敓浠€涔堝啿绐佹垨浜掕ˉ锛?,
  '濡傛灉鍗佸勾鍚庣殑浣犱滑鍥炵湅杩欐瀵硅瘽锛屼細瑙夊緱閬楁喚杩樻槸搴嗗垢锛?,
  '璇曠潃鐢ㄥ鏂硅亴涓氱殑瑙嗚锛岄噸鏂版弿杩拌繖涓儏澧冦€?,
  '濡傛灉杩欎釜鏁呬簨瑕佹湁涓€涓浆鎶橈紝瀹冧細鍙戠敓鍦ㄤ粈涔堟椂鍊欙紵',
  '浣犱滑鍚勮嚜鎻愬埌鐨勭粏鑺備腑锛屾湁娌℃湁鍙互涓茶仈璧锋潵鐨勭嚎绱紵',
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
  // 鍐嶆璁剧疆瀹氭椂鍣紙濡傛灉浠嶇劧娌′汉璇磋瘽锛屼細缁х画鎺ㄩ€侊級
  resetCatalystTimer(roomId);
}

// ========== 鍚姩鏈嶅姟鍣?==========
server.listen(PORT, '0.0.0.0', () => {
  console.log(`馃殌 缇ゅ儚路鏄熺伀鏈嶅姟鍣ㄨ繍琛屽湪 http://0.0.0.0:${PORT}`);
  console.log(`馃寪 WebSocket 绔偣: ws://0.0.0.0:${PORT}`);
});
