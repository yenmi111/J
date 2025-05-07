const express = require('express');


const app = express();
app.use(express.json()); // 解析 JSON

//  設定資料庫連線池
const pool =require('./db');// 連線資料庫

// 登入 ：如果已登入則不能重複登入
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
      if (user[0].is_logged_in) throw new Error("此帳號已登入，請先登出");
      return conn.query("UPDATE users SET is_logged_in = 1 WHERE username = ?", [username]);    //session
    })

    
    .then(() => {
      return Promise.all([ // 同時執行兩個 SQL 查詢
        conn.query("SELECT * FROM private WHERE username = ?", [username]),
        conn.query("SELECT Membership, Orderhistory FROM info WHERE username = ?", [username])
      ]);
    })
    .then(([privateInfo, userInfo]) => {
      res.json({
        message: "登入成功",
        username,
        private: privateInfo[0] || null,
        info: userInfo[0] || null
      });
    })
    .catch(err => res.status(401).json({ error: err.message })) //401未授權(登入失敗)
    .finally(() => { if (conn) conn.release(); });  //程式執行結束後釋放資料庫連線
}); 

// 登出 
app.post('/api/logout', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: "請提供 username 和 password" });

  let conn;
  pool.getConnection()
    .then(connection => {
      conn = connection;
      return conn.query("UPDATE users SET is_logged_in = 0 WHERE username = ?", [username]);
    })
    .then(() => res.json({ message: "登出成功" }))
    .catch(err => res.status(500).json({ error: err.message }))
    .finally(() => { if (conn) conn.release(); });
});


//  註冊 
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
//  刪除帳號 
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
      return conn.query("SELECT * FROM private WHERE username = ?", [username]);
    })
    .then(privateInfo => {
      if (privateInfo.length === 0 || privateInfo[0].email !== email) throw new Error("信箱不匹配");
      return conn.query("DELETE FROM private WHERE username = ?", [username]);
    })
    .then(() => conn.query("DELETE FROM info WHERE username = ?", [username]))
    .then(() => conn.query("DELETE FROM users WHERE username = ?", [username]))
     // 依序刪除 private、info、users
    .then(() => res.json({ message: "帳戶刪除成功" }))
    .catch(err => res.status(401).json({ error: err.message }))
    .finally(() => { if (conn) conn.release(); });
});

// 啟動伺服器
app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
