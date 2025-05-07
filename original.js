//original version

//npm install express-session

const express = require('express');
const pool = require('./db'); // 連線資料庫

const app = express();
app.use(express.json()); // 解析JSON

// 登入 API：直接比對密碼，返回 private & info 資料
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: "請提供 username 和 password" }); //400 用戶端錯誤

  let conn; //存儲資料庫連線物件
  pool.getConnection() //連接MariaDB
    .then(connection => {
      conn = connection;
      return conn.query("SELECT * FROM users WHERE username = ?", [username]);
    })
    .then(user => {
      if (user.length === 0 || user[0].password !== password) throw new Error("帳號或密碼錯誤");

      // 取得 private & info 資料
      return Promise.all([ //同時執行兩個 SQL 查詢
        conn.query("SELECT * FROM private WHERE username = ?", [username]),
        conn.query("SELECT Membership,Orderhistory FROM info WHERE username = ?", [username])
      ]).then(([privateInfo, userInfo]) => {
        res.json({
          message: "登入成功",
          private: privateInfo[0] || null, 
          info: userInfo[0] || null
        });
      });
    })
    .catch(err => {
      res.status(401).json({ error: err.message }); //401未授權(登入失敗)
    })
    .finally(() => {
      if (conn) conn.release(); //程式執行結束後釋放資料庫連線
    });
});

// 🔹 註冊 API（無加密密碼）
app.post('/api/register', (req, res) => {
  const { username, password, telephone, email } = req.body;
  if (!username || !password || !telephone || !email) {
    return res.status(400).json({ error: "請提供 username, password, telephone, email" });
  }

  let conn;
  pool.getConnection()
    .then(connection => {
      conn = connection;
      return conn.query("SELECT * FROM users WHERE username = ?", [username]);
    })
    .then(existingUser => {
      if (existingUser.length > 0) throw new Error("此帳號已被註冊");
      return conn.query("INSERT INTO users (username, password) VALUES (?, ?)", [username, password]);
    })
    .then(() => {
      return conn.query("INSERT INTO private (username, telephone, email) VALUES (?, ?, ?)", [username, telephone, email]);
    })
    .then(() => {
      return conn.query("INSERT INTO info (username, Membership, Orderhistory) VALUES (?, 'card member', 0)", [username]);
    })
    .then(() => {
      res.json({ message: "註冊成功", username });
    })
    .catch(err => {
      res.status(500).json({ error: err.message }); //500 內部伺服器錯誤
    })
    .finally(() => {
      if (conn) conn.release();
    });
});

// 🔹 刪除使用者 API
app.post('/api/delete', (req, res) => {
  const { username, password, email } = req.body;
  if (!username || !password || !email) {
    return res.status(400).json({ error: "請提供 username, password, email" });
  }

  let conn;
  pool.getConnection()
    .then(connection => {
      conn = connection;
      return conn.query("SELECT * FROM users WHERE username = ?", [username]);
    })
    .then(user => {
      if (user.length === 0 || user[0].password !== password) throw new Error("帳號或密碼錯誤");

      // 確認 email 是否正確
      return conn.query("SELECT * FROM private WHERE username = ?", [username]);
    })
    .then(privateInfo => {
      if (privateInfo.length === 0 || privateInfo[0].email !== email) throw new Error("信箱不匹配");

      // 依序刪除 private、info、users
      return Promise.all([
        conn.query("DELETE FROM private WHERE username = ?", [username]),
        conn.query("DELETE FROM info WHERE username = ?", [username]),
        conn.query("DELETE FROM users WHERE username = ?", [username])
      ]);
    })
    .then(() => {
      res.json({ message: "帳戶刪除成功" });
    })
    .catch(err => {
      res.status(401).json({ error: err.message });
    })
    .finally(() => {
      if (conn) conn.release();
    });
});

// 🔹 啟動伺服器
app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
