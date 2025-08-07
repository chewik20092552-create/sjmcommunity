// server.js
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

dotenv.config();
const corsOptions = {
  origin: [
    'https://sjmcommunity.onrender.com',
    'http://localhost:3000'
  ],
  credentials: true
};
app.use(cors(corsOptions));

const app = express();
const server = http.createServer(app); // ใช้ server นี้ทั้ง express และ socket.io
const io = new Server(server, { cors: { origin: '*' } });
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../sjm-frontend')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../sjm-frontend/home_out.html'));
});

// DB Connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

pool.connect()
  .then(() => console.log('✅ PostgreSQL Connected'))
  .catch(err => console.error('❌ Database connection error', err));

// REGISTER
app.post('/api/register', async (req, res) => {
  const { username, studentId, password } = req.body;

  if (!username || !studentId || !password) {
    return res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบ" });
  }

  const hashed = await bcrypt.hash(password, 10);
  const sql = 'INSERT INTO user_sjm (username, studentId, password) VALUES ($1, $2, $3)';

  try {
    await pool.query(sql, [username, studentId, hashed]);
    res.status(200).json({ message: 'สมัครสมาชิกสำเร็จ' });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(400).json({ message: "บัญชีนี้ถูกใช้ไปแล้ว" });
    }
    return res.status(500).json({ message: 'เกิดข้อผิดพลาด', error: err });
  }
});

// LOGIN
app.post('/api/login', async (req, res) => {
  const { studentId, password } = req.body;

  const sql = 'SELECT * FROM user_sjm WHERE studentId = $1';
  try {
    const result = await pool.query(sql, [studentId]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ message: 'ไม่พบผู้ใช้' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'รหัสผ่านไม่ถูกต้อง' });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'secret');
    res.status(200).json({ message: 'เข้าสู่ระบบสำเร็จ', token });
  } catch (err) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาด', error: err });
  }
});

// GET PROFILE
app.get('/api/profile', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'ไม่มี token' });

  jwt.verify(token, process.env.JWT_SECRET || 'secret', (err, decoded) => {
    if (err) return res.status(401).json({ message: 'token ไม่ถูกต้อง' });

    const sql = 'SELECT username, studentId FROM user_sjm WHERE id = $1';
    pool.query(sql, [decoded.id])
      .then(result => {
        if (result.rows.length === 0)
          return res.status(404).json({ message: 'ไม่พบผู้ใช้' });
        res.status(200).json(result.rows[0]);
      })
      .catch(err => res.status(500).json({ message: 'เกิดข้อผิดพลาด', error: err }));
  });
});

// SOCKET.IO
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

    if (socket.room) {
      io.to(socket.room).emit('message', { text: 'คู่สนทนาออกจากแชท', sender: 'system' });
    }
  });

  socket.on('leaveRoom', ({ room }) => {
    console.log(`🚪 User ${socket.id} left room ${room}`);
    socket.leave(room);

    socket.to(room).emit('message', { text: 'คู่สนทนาออกจากห้อง', sender: 'system' });

    const index = waitingUsers.findIndex(s => s.id === socket.id);
    if (index !== -1) {
      waitingUsers.splice(index, 1);
    }

    socket.room = null;
  });
});

// START SERVER
server.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});


