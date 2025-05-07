const express = require('express');

const app = express();
app.use(express.json()); // 解析 JSON
const pool = require('./db'); // 連線資料庫




// inner join
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  console.log(typeof username );

  if (!username || !password) return res.status(400).json({ error: "請提供 username 和 password" });

  let conn;
  try {
    conn = await pool.getConnection();
    const [user] = await conn.query("SELECT * FROM users WHERE username = ?", username);
    //const [user] = await conn.query("SELECT * FROM users ");
    console.log(user);

    if (!user || user.password !== password) throw new Error("帳號或密碼錯誤");
    //if (user.is_logged_in) throw new Error("此帳號已登入，請先登出");

    //await conn.query("UPDATE users SET is_logged_in = 1 WHERE username = ?", username);
    //const [privateInfo] = await conn.query("SELECT * FROM private WHERE user_id = ?", user.id);
    //const [userInfo] = await conn.query("SELECT Membership, Orderhistory FROM info WHERE user_id = ?", user.id);
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
      // info: userData
        // ? { Membership: userData.Membership, Orderhistory: userData.Orderhistory }
        // : null 
      });
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


// LEFT join
const [userData] = await conn.query(`
  SELECT 
    private.*, 
    info.Membership, 
    info.Orderhistory
  FROM private
  LEFT JOIN info ON private.user_id = info.user_id
  WHERE private.user_id = ?
`, [user.id]);

//  RIGHT join
const [userData] = await conn.query(`
  SELECT 
    private.*, 
    info.Membership, 
    info.Orderhistory
  FROM private
  RIGHT JOIN info ON private.user_id = info.user_id
  WHERE private.user_id = ?
`, [user.id]);

//FULL join(任一方有資料)
const [userData] = await conn.query(`
  SELECT 
    private.*, 
    info.Membership, 
    info.Orderhistory
  FROM private
  FULL JOIN info ON private.user_id = info.user_id
  WHERE private.user_id = ?
`, [user.id]);

//CROSS join(交叉連接)
SELECT 
  users.name, 
  coupons.coupon_name
FROM users
CROSS JOIN coupons

/* 
(users)
user_id	  name
  1	      Jim
  2	      Lisa
 */


/* (coupons)

    coupon_id	      coupon_name
      A01	            生日折扣
      B22	            首購優惠
 */


/*   name	      coupon_name
      Jim	        生日折扣
      Jim	        首購優惠
      Lisa	      生日折扣
      Lisa	      首購優惠
 */





const express = require('express');

const app = express();
app.use(express.json()); // 解析 JSON
const pool = require('./db'); // 連線資料庫




// inner join
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  console.log(typeof username );

  if (!username || !password) return res.status(400).json({ error: "請提供 username 和 password" });

  let conn;
  try {
    conn = await pool.getConnection();
    const [user] = await conn.query("SELECT * FROM users WHERE username = ?", username);
    //const [user] = await conn.query("SELECT * FROM users ");
    console.log(user);

    if (!user || user.password !== password) throw new Error("帳號或密碼錯誤");
    //if (user.is_logged_in) throw new Error("此帳號已登入，請先登出");

    //await conn.query("UPDATE users SET is_logged_in = 1 WHERE username = ?", username);
    //const [privateInfo] = await conn.query("SELECT * FROM private WHERE user_id = ?", user.id);
    //const [userInfo] = await conn.query("SELECT Membership, Orderhistory FROM info WHERE user_id = ?", user.id);
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

    res.json({ message: "登入成功", username, private: userData || null,
      // info: userData
        // ? { Membership: userData.Membership, Orderhistory: userData.Orderhistory }
        // : null 
      });
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
    await conn.query("UPDATE users SET is_logged_in = 0 WHERE username = ?", username);
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
    const [existingUser] = await conn.query("SELECT * FROM users WHERE username = ?", username);
    if (existingUser) throw new Error("此帳號已被註冊");

    await conn.query("INSERT INTO users (username, password) VALUES (?, ?)", [username, password]);

    const [user] = await conn.query("SELECT * FROM users WHERE username = ?", [username]);
 
    await conn.query("INSERT INTO private (user_id, telephone, email) VALUES (?, ?, ?)", [user.id, telephone, email]);

    await conn.query("INSERT INTO info (user_id, Membership, Orderhistory) VALUES (?, 'card member', 0)", [user.id]);

   

/*     await conn.query("INSERT INTO users (username, password) VALUES (?, ?)", [username, password]);
    await conn.query("INSERT INTO private ( telephone, email) VALUES (?, ?)",  [telephone, email]);
    await conn.query("INSERT INTO info (Membership, Orderhistory) VALUES ('card member', 0)"); */

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

    const [privateInfo] = await conn.query("SELECT * FROM private WHERE user_id = ?", user.id);
    if (!privateInfo || privateInfo.email !== email) throw new Error("信箱不匹配");

    await conn.query("DELETE FROM private WHERE user_id = ?", user.id);
    await conn.query("DELETE FROM info WHERE user_id = ?", user.id);
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

