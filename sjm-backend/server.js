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

const app = express();
const server = http.createServer(app);
const io = new Server(server, { 
  cors: { 
    origin: ['https://sjmcommunity.onrender.com'],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  } 
});

const port = process.env.PORT || 3000;

// CORS Configuration
const corsOptions = {
  origin: [
    'https://sjmcommunity.onrender.com',
    'http://localhost:3000' // สำหรับ development
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE']
};
app.use(cors(corsOptions));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../sjm-frontend')));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../sjm-frontend/home_out.html'));
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    status: 'success',
    message: 'API is working!',
    timestamp: new Date()
  });
});

// DB Connection
const pool = new Pool({
  host: process.env.PGHOST,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  connectionString: process.env.DATABASE_URL,
  port: process.env.PGPORT || 5432,
  ssl: { rejectUnauthorized: false } // render/railway ต้องใช้ ssl
});

pool.connect()
  .then(() => console.log('✅ PostgreSQL Connected'))
  .catch(err => console.error('❌ Database connection error', err));

// REGISTER ENDPOINT
app.post('/api/register', async (req, res) => {
  const { username, studentid, password } = req.body;

  // Validation
  if (!username || !studentid || !password) {
    return res.status(400).json({ 
      success: false,
      message: "กรุณากรอกข้อมูลให้ครบทุกช่อง" 
    });
  }

  try {
    // Check if user exists
    const userExists = await pool.query(
      'SELECT * FROM sjm_db WHERE username = $1 OR studentid = $2', 
      [username, studentid]
    );

    if (userExists.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "ชื่อผู้ใช้หรือรหัสนักเรียนนี้ถูกใช้ไปแล้ว"
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = await pool.query(
      'INSERT INTO sjm_db (username, studentid, password) VALUES ($1, $2, $3) RETURNING id, username, studentid',
      [username, studentid, hashedPassword]
    );

    res.status(201).json({
      success: true,
      message: "ลงทะเบียนสำเร็จ",
      user: newUser.rows[0]
    });

  } catch (err) {
    console.error('Registration Error:', err);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการลงทะเบียน",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// LOGIN ENDPOINT
app.post('/api/login', async (req, res) => {
  const { studentid, password } = req.body;

  // Basic validation
  if (!studentid || !password) {
    return res.status(400).json({ 
      success: false,
      message: "กรุณากรอกรหัสนักเรียนและรหัสผ่าน"
    });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM sjm_db WHERE studentid = $1', 
      [studentid]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "ไม่พบผู้ใช้"
      });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "รหัสผ่านไม่ถูกต้อง"
      });
    }

    // Create token
    const token = jwt.sign(
      { id: user.id, studentid: user.studentid },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1d' }
    );

    res.status(200).json({
      success: true,
      message: "เข้าสู่ระบบสำเร็จ",
      token,
      user: {
        id: user.id,
        username: user.username,
        studentid: user.studentid
      }
    });

  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการเข้าสู่ระบบ",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// PROFILE ENDPOINT
app.get('/api/profile', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: 'ไม่มี token' 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    const result = await pool.query(
      'SELECT username, studentid FROM sjm_db WHERE id = $1',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'ไม่พบผู้ใช้' 
      });
    }

    res.status(200).json({
      success: true,
      username: result.rows[0].username,
      studentid: result.rows[0].studentid
    });

  } catch (err) {
    console.error('Profile Error:', err);
    res.status(401).json({ 
      success: false,
      message: 'token ไม่ถูกต้องหรือหมดอายุ' 
    });
  }
});

// GET: ดึงรายชื่อห้องทั้งหมด
app.get('/api/rooms', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM chat_rooms ORDER BY created_at DESC');
    res.json({ success: true, rooms: result.rows });
  } catch (err) {
    console.error('Get Rooms Error:', err);
    res.status(500).json({ success: false, message: 'ไม่สามารถดึงรายชื่อห้องได้' });
  }
});

// POST: สร้างห้องใหม่
app.post('/api/rooms', async (req, res) => {
  const { name } = req.body;

  if (!name) return res.status(400).json({ success: false, message: 'ต้องใส่ชื่อห้อง' });

  try {
    const result = await pool.query(
      'INSERT INTO chat_rooms (name) VALUES ($1) RETURNING *',
      [name]
    );

    // ส่ง event ให้ทุก client ที่ connect อยู่
    io.emit('roomCreated', result.rows[0]);

    res.status(201).json({ success: true, room: result.rows[0] });
  } catch (err) {
    console.error('Create Room Error:', err);
    res.status(500).json({ success: false, message: 'สร้างห้องไม่สำเร็จ' });
  }
});


// SOCKET.IO CONFIGURATION
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
      io.to(socket.room).emit('message', { 
        text: 'คู่สนทนาออกจากแชท', 
        sender: 'system' 
      });
    }
  });

  socket.on('leaveRoom', ({ room }) => {
    console.log(`🚪 User ${socket.id} left room ${room}`);
    socket.leave(room);

    socket.to(room).emit('message', { 
      text: 'คู่สนทนาออกจากห้อง', 
      sender: 'system' 
    });

    const index = waitingUsers.findIndex(s => s.id === socket.id);
    if (index !== -1) {
      waitingUsers.splice(index, 1);
    }

    socket.room = null;
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'เกิดข้อผิดพลาดในระบบ',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'ไม่พบหน้าเพจที่ต้องการ'
  });
});

// START SERVER
server.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
