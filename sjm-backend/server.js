// server.js
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const path = require('path');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
dotenv.config();
app.use(cors());
app.use(bodyParser.json());

// DB Connection
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});


db.connect(err => {
  if (err) throw err;
  console.log('✅ MySQL Connected');
});

// REGISTER
app.post('/api/register', async (req, res) => {
  const { username, studentId, password } = req.body;

  if (!username || !studentId || !password) {
    return res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบ" });
  }

  const hashed = await bcrypt.hash(password, 10);
  const sql = 'INSERT INTO user_sjm (username, studentId, password) VALUES (?, ?, ?)';

  db.query(sql, [username, studentId, hashed], (err, result) => {
    if (err) {
      if (err.code === "ER_DUP_ENTRY") {
        return res.status(400).json({ message: "บัญชีนี้ถูกใช้ไปแล้ว" });
      }
      return res.status(500).json({ message: 'เกิดข้อผิดพลาด', error: err });
    }
    res.status(200).json({ message: 'สมัครสมาชิกสำเร็จ' });
  });
});

// LOGIN
app.post('/api/login', (req, res) => {
  const {studentId, password } = req.body;

  const sql = 'SELECT * FROM user_sjm WHERE studentId = ?';
  db.query(sql, [studentId], async (err, results) => {
    if (err || results.length === 0) return res.status(401).json({ message: 'ไม่พบผู้ใช้' });

    const user = results[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) return res.status(401).json({ message: 'รหัสผ่านไม่ถูกต้อง' });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'secret');
    res.status(200).json({ message: 'เข้าสู่ระบบสำเร็จ', token });
  });
});

// Serve front-end
app.use(express.static(path.join(__dirname, '../sjm-frontend')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../sjm-frontend/home_out.html'));
});

app.get('/api/profile', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'ไม่มี token' });

  jwt.verify(token, process.env.JWT_SECRET || 'secret', (err, decoded) => {
    if (err) return res.status(401).json({ message: 'token ไม่ถูกต้อง' });

    const sql = 'SELECT username, studentId FROM user_sjm WHERE id = ?';
    db.query(sql, [decoded.id], (err, results) => {
      if (err || results.length === 0)
        return res.status(404).json({ message: 'ไม่พบผู้ใช้' });
      res.status(200).json(results[0]);
    });
  });
});

app.get('/api/profile', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'ไม่มี token' });

  jwt.verify(token, process.env.JWT_SECRET || 'secret', (err, decoded) => {
    if (err) return res.status(401).json({ message: 'token ไม่ถูกต้อง' });

    const sql = 'SELECT username, studentId FROM user_sjm WHERE id = ?';
    db.query(sql, [decoded.id], (err, results) => {
      if (err || results.length === 0)
        return res.status(404).json({ message: 'ไม่พบผู้ใช้' });
      res.status(200).json(results[0]);
    });
  });
});

app.use(express.static(path.join(__dirname, '../sjm-frontend')));

const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const waitingUsers = [];

io.on('connection', socket => {
    console.log('🔗 New user connected:', socket.id);

    if (waitingUsers.length > 0) {
        const partner = waitingUsers.shift();
        const room = `room-${socket.id}-${partner.id}`;

        socket.join(room);
        partner.join(room);

        socket.emit('matched', { room });
        partner.emit('matched', { room });

        socket.room = room;
        partner.room = room;
    } else {
        waitingUsers.push(socket);
        socket.emit('waiting');
    }

    socket.on('message', ({ room, text }) => {
        socket.to(room).emit('message', { text, sender: 'them' });
    });

    socket.on('disconnect', () => {
        console.log('❌ User disconnected:', socket.id);
        const index = waitingUsers.indexOf(socket);
        if (index !== -1) {
            waitingUsers.splice(index, 1);
        }
        io.to(socket.room).emit('message', { text: 'คู่สนทนาออกจากแชท', sender: 'system' });
    });

    socket.on('leaveRoom', ({ room }) => {
    console.log(`🚪 User ${socket.id} left room ${room}`);

    socket.leave(room);

    // แจ้งอีกฝั่งในห้องว่าคู่ของเขาออก
    socket.to(room).emit('message', { text: 'คู่สนทนาออกจากห้อง', sender: 'system' });

    // ถอดออกจาก waiting queue เผื่อยังรอ
    const index = waitingUsers.findIndex(s => s.id === socket.id);
    if (index !== -1) {
        waitingUsers.splice(index, 1);
    }

    socket.room = null;
});


});

server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});


