document.addEventListener('DOMContentLoaded', () => {
  const profileButton = document.getElementById('profile_button');

  // โหลดโปรไฟล์
  profileButton.addEventListener('click', async () => {
    const token = localStorage.getItem('token');

    const res = await fetch(`/api/profile`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    if (res.status === 200) {
      const data = await res.json();
      document.getElementById('profileUsername').innerText = data.username;
      document.getElementById('profileStudentId').innerText = data.studentid;
      document.getElementById('profileModal').classList.remove('hidden');
    } else {
      localStorage.removeItem('token');
      window.location.href = "home_out.html";
    }
  });

  // โหลดรายชื่อห้องทันทีตอนเปิดหน้า
  loadRooms();
});

// ปิด modal โปรไฟล์
function closeProfileModal() {
  document.getElementById('profileModal').classList.add('hidden');
}

// logout
function logout() {
  localStorage.removeItem('token');
  window.location.href = "home_out.html";
}

// ============================
// ส่วนของสร้างห้อง
// ============================
const createRoomBtn = document.getElementById("create");
const createRoomModal = document.getElementById("createRoomModal");
const cancelCreateRoom = document.getElementById("cancelCreateRoom");
const confirmCreateRoom = document.getElementById("confirmCreateRoom");
const roomNameInput = document.getElementById("roomNameInput");
const roomListEl = document.getElementById("roomList");

createRoomBtn.addEventListener("click", () => {
  createRoomModal.classList.remove("hidden");
});

cancelCreateRoom.addEventListener("click", () => {
  createRoomModal.classList.add("hidden");
});

// ✅ กดสร้างห้อง -> เรียก API -> เคลียร์ input -> โหลดห้องใหม่
confirmCreateRoom.addEventListener("click", async () => {
  const roomName = roomNameInput.value.trim();
  if (!roomName) {
    alert("กรุณาใส่ชื่อห้องก่อน!");
    return;
  }

  try {
    const res = await fetch('/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: roomName })
    });

    const data = await res.json();

    if (data.success) {
      roomNameInput.value = ""; // ✅ ล้างช่อง input
      createRoomModal.classList.add("hidden");
      await loadRooms(); // โหลดห้องใหม่
    } else {
      alert("สร้างห้องไม่สำเร็จ!");
    }
  } catch (err) {
    console.error("Create Room Error:", err);
    alert("เกิดข้อผิดพลาดในการสร้างห้อง");
  }
});

// ============================
// โหลดห้องจาก API
// ============================
async function loadRooms() {
  try {
    const res = await fetch('/api/rooms');
    const data = await res.json();

    if (data.success) {
      roomListEl.innerHTML = '<h3 class="text-lg font-bold mb-2">รายชื่อห้อง</h3>';
      data.rooms.forEach(room => {
        const div = document.createElement('div');
        div.className = 'p-2 bg-gray-100 rounded-lg mb-2 cursor-pointer hover:bg-gray-200 flex justify-between';
        div.innerHTML = `
          <span>${room.name}</span>
          <button class="bg-blue-500 text-white px-2 py-1 rounded" onclick="joinRoom('${room.name}')">Join</button>
        `;
        roomListEl.appendChild(div);
      });
    }
  } catch (err) {
    console.error('Load Rooms Error:', err);
  }
}

// ============================
// join room
// ============================
function joinRoom(roomName) {
  window.location.href = `chat_room.html?room=${encodeURIComponent(roomName)}`;
}

// ============================
// ฟัง event realtime จาก socket.io
// ============================
const socket = io();
socket.on('roomCreated', () => {
  loadRooms();
});
