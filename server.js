// app.js
require('dotenv').config(); 

const express = require('express');
const session = require('express-session');

const RedisStore = require('connect-redis')(session);
const Redis = require('ioredis'); 


const pool = require('./db'); 

const app = express();
app.use(express.json());

// ✅ 新增：建立 Redis 客戶端，連線到 Docker 內的 Redis（預設本地 6379 port）
const redisClient = new Redis({

  host: 'redis-test',
  port: 6379
});

const redisStore = new RedisStore({
  client: redisClient,  // 使用 ioredis client
  prefix: 'sess:'  // 設定 Redis 儲存鍵的前綴
});


app.use(session({
  store: redisStore, // 使用初始化好的 store
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { 
    maxAge: 1000 * 60 * 60,
    secure: false,
    httpOnly: true
  } // 1 小時
}));


// 登入
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: "請提供 username 和 password" });

  let conn;
  try {
    conn = await pool.getConnection();
    const [user] = await conn.query("SELECT * FROM users WHERE username = ?", username);
    console.log(user);

    if (!user || user.password !== password) throw new Error("帳號或密碼錯誤");

    req.session.user = {
      id: user.id,
      username: user.username
    };

    const [userData] = await conn.query(`
     SELECT 
          private.*, 
          info.Membership, 
          info.Orderhistory
        FROM private
        INNER JOIN info ON private.user_id = info.user_id
        WHERE private.user_id = ?
    `, [user.id]);

    console.log(userData);

    res.json({ message: "登入成功", username, private: userData || null
      });
  } catch (err) {
    res.status(401).json({ error: err.message });
  } finally {
    if (conn) conn.release();
  }
});

// 登出
app.post('/api/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ error: "登出失敗" });
    res.clearCookie('connect.sid');
    res.json({ message: "登出成功" });
  });
});

// 取得目前登入使用者
app.get('/api/me', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "尚未登入" });
  }
  let conn;
  try {
    conn = await pool.getConnection();
    const [userData] = await conn.query(`
     SELECT 
          private.*, 
          info.Membership, 
          info.Orderhistory
        FROM private
        INNER JOIN info ON private.user_id = info.user_id
        WHERE private.user_id = ?
    `, [req.session.user.id]);

    if (!userData) {
      return res.status(404).json({ error: "使用者資料不存在" });
    }
   
  
  res.json({
    message: "使用者已登入",
    username:req.session.user.username, private: userData || null
  });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) conn.release();
  }
});

// 註冊
app.post('/api/register', async (req, res) => {
  const { username, password, telephone, email } = req.body;
  if (!username || !password || !telephone || !email) {
    return res.status(400).json({ error: "請提供 username, password, telephone, email" });
  }

  let conn;
  try {
    conn = await pool.getConnection();
    const [existingUser] = await conn.query("SELECT * FROM users WHERE username = ?", username);
    if (existingUser) throw new Error("此帳號已被註冊");

    await conn.query("INSERT INTO users (username, password) VALUES (?, ?)", [username, password]);
    const [user] = await conn.query("SELECT * FROM users WHERE username = ?", [username]);

    await conn.query("INSERT INTO private (user_id, telephone, email) VALUES (?, ?, ?)", [user.id, telephone, email]);
    await conn.query("INSERT INTO info (user_id, Membership, Orderhistory) VALUES (?, 'card member', 0)", [user.id]);

    res.json({ message: "註冊成功", username });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) conn.release();
  }
});

// 刪除帳號
app.post('/api/delete', async (req, res) => {
  const { username, password, email } = req.body;
  if (!username || !password || !email) {
    return res.status(400).json({ error: "請提供 username, password, email" });
  }

  let conn;
  try {
    conn = await pool.getConnection();
    const [user] = await conn.query("SELECT * FROM users WHERE username = ?", username);

    if (!user || user.password !== password) throw new Error("帳號或密碼錯誤");

    const [privateInfo] = await conn.query("SELECT * FROM private WHERE user_id = ?", [user.id]);
    if (!privateInfo || privateInfo.email !== email) throw new Error("信箱不匹配");

    await conn.query("DELETE FROM private WHERE user_id = ?", user.id);
    await conn.query("DELETE FROM info WHERE user_id = ?", user.id);
    await conn.query("DELETE FROM users WHERE id = ?", [username]);

    res.json({ message: "帳戶刪除成功" });
  } catch (err) {
    res.status(401).json({ error: err.message });
  } finally {
    if (conn) conn.release();
  }
});

// 啟動伺服器
app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
