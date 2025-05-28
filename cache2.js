//docker lnuix
//redis-test

//npm install connect-redis ioredis

// app.js
require('dotenv').config(); 

const express = require('express');
const session = require('express-session');

const RedisStore = require('connect-redis')(session);
const Redis = require('ioredis'); 


const pool = require('./db'); 

const app = express();
app.use(express.json());

const redisClient = new Redis({

  host: 'redis-test',
  port: 6379
});

const redisStore = new RedisStore({
  client: redisClient,  
  prefix: 'sess:'  
});


app.use(session({
  store: redisStore,
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { 
    maxAge: 1000 * 60 * 60,
    secure: false,
    httpOnly: true
  } 
}));


// 登入
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "請提供 username 和 password" });
  }

  let conn;
  try {
    conn = await pool.getConnection();
    const [user] = await conn.query("SELECT * FROM users WHERE username = ?", username);
    if (!user || user.password !== password) throw new Error("帳號或密碼錯誤");
    const [userData] = await conn.query(`
      SELECT 
        private.*, 
        info.Membership, 
        info.Orderhistory
      FROM private
      INNER JOIN info ON private.user_id = info.user_id
      WHERE private.user_id = ?
    `, [user.id]);

    //都會建立/更新 session
    req.session.user = {
      id: user.id,
      username: user.username
    };

    //建立/更新 Redis 快取
    const cacheKey = `user:data:${user.id}`;
    const responseData = {
      message: "使用者已登入",
      username: user.username,
      private: {
        telephone: userData.telephone,
        email: userData.email,
        membership: userData.Membership,
        orderHistory: userData.Orderhistory
      }
    };
    await redisClient.setex(cacheKey, 60, JSON.stringify(responseData)); // 快取 60 秒

    console.log("登入成功");
    res.json(responseData);

  } catch (err) {
    res.status(401).json({ error: err.message });
  } finally {
    if (conn) conn.release();
  }
});


// 登出

app.post('/api/logout', (req, res) => {
  if (!req.session.user) {
    return res.status(400).json({ error: "尚未登入" });
  }

  const userId = req.session.user.id;
  const cacheKey = `user:data:${userId}`;

  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ error: "登出失敗" });
    }

    // 清除 Redis 快取
    redisClient.del(cacheKey, (err, response) => {
      if (err) {
        console.error("刪除快取失敗:", err);
        return res.status(500).json({ error: "清除快取失敗" });
      }

      // 回應成功登出
      res.clearCookie('connect.sid');
      res.json({ message: "登出成功" });
    });
  });
});



// 取得目前登入使用者
app.get('/api/me', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "尚未登入" });
  }
 
  const userId = req.session.user.id;
  const username = req.session.user.username;
  const cacheKey = `user:data:${userId}`;

  try {
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      console.log('從 Redis 快取取得');
      return res.json(JSON.parse(cached));
    }

  // 2. Redis 無資料 → 查詢資料庫
    const conn = await pool.getConnection();
    const [userData] = await conn.query(`
      SELECT 
        private.telephone, 
        private.email, 
        info.Membership, 
        info.Orderhistory
      FROM private
      INNER JOIN info ON private.user_id = info.user_id
      WHERE private.user_id = ?
    `, [userId]);

    conn.release();

    if (!userData) {
      return res.status(404).json({ error: "使用者資料不存在" });
    }

    const responseData = {
      message: "使用者已登入",
      username,
      private: {
        telephone: userData.telephone,
        email: userData.email,
        membership: userData.Membership,
        orderHistory: userData.Orderhistory
      }
    };

    // 3. 將查詢結果存入 Redis 快取（例如 60 秒）
    await redisClient.setex(cacheKey, 60, JSON.stringify(responseData));
    console.log('✅ 從資料庫取得並快取');
    return res.json(responseData);

  } catch (err) {
    res.status(500).json({ error: err.message });
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

    await redisClient.del(`user:data:${user.id}`);
    req.session.destroy(() => {}); // 清除 session
    res.clearCookie('connect.sid');
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
