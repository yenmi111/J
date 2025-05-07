const express = require('express');

const app = express();
app.use(express.json()); // 解析 JSON
const pool = require('./db'); // 連線資料庫




// 登入
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: "請提供 username 和 password" });

  let conn;
  try {
    conn = await pool.getConnection();
    const [user] = await conn.query("SELECT * FROM users WHERE username = ?", [username]);
    if (!user || user.password !== password) throw new Error("帳號或密碼錯誤");
    if (user.is_logged_in) throw new Error("此帳號已登入，請先登出");

    await conn.query("UPDATE users SET is_logged_in = 1 WHERE username = ?", [username]);
    const [privateInfo] = await conn.query("SELECT * FROM private WHERE username = ?", [username]);
    const [userInfo] = await conn.query("SELECT Membership, Orderhistory FROM info WHERE username = ?", [username]);

    res.json({ message: "登入成功", username, private: privateInfo || null, info: userInfo || null });
  } catch (err) {
    res.status(401).json({ error: err.message });
  } finally {
    if (conn) conn.release();
  }
});

// 登出
app.post('/api/logout', async (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: "請提供 username" });

  let conn;
  try {
    conn = await pool.getConnection();
    await conn.query("UPDATE users SET is_logged_in = 0 WHERE username = ?", [username]);
    res.json({ message: "登出成功" });
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
    const [existingUser] = await conn.query("SELECT * FROM users WHERE username = ?", [username]);
    if (existingUser) throw new Error("此帳號已被註冊");

    await conn.query("INSERT INTO users (username, password) VALUES (?, ?)", [username, password]);
    await conn.query("INSERT INTO private (username, telephone, email) VALUES (?, ?, ?)", [username, telephone, email]);
    await conn.query("INSERT INTO info (username, Membership, Orderhistory) VALUES (?, 'card member', 0)", [username]);

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
    const [user] = await conn.query("SELECT * FROM users WHERE username = ?", [username]);
    if (!user || user.password !== password) throw new Error("帳號或密碼錯誤");

    const [privateInfo] = await conn.query("SELECT * FROM private WHERE username = ?", [username]);
    if (!privateInfo || privateInfo.email !== email) throw new Error("信箱不匹配");

    await conn.query("DELETE FROM private WHERE username = ?", [username]);
    await conn.query("DELETE FROM info WHERE username = ?", [username]);
    await conn.query("DELETE FROM users WHERE username = ?", [username]);

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
