document.addEventListener('DOMContentLoaded', () => {
  const profileButton = document.getElementById('profile_button');

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
});

function closeProfileModal() {
  document.getElementById('profileModal').classList.add('hidden');
}

function logout() {
  localStorage.removeItem('token');
  window.location.href = "home_out.html";
}

document.getElementById("enterChatBtn").addEventListener("click", () => {
  const nicknameInput = document.getElementById("nickname");
  const nickname = nicknameInput.value.trim();
  const errorEl = document.getElementById("nicknameError");

  if (!nickname) {
    errorEl.textContent = "กรุณาใส่ชื่อเล่นก่อนเข้าแชท";
    return;
  }

  errorEl.textContent = ""; // clear error
  localStorage.setItem("nickname", nickname);
  window.location.href = "chat1-1.html";
});

const createRoomBtn = document.getElementById("create");
const createRoomModal = document.getElementById("createRoomModal");
const cancelCreateRoom = document.getElementById("cancelCreateRoom");
const confirmCreateRoom = document.getElementById("confirmCreateRoom");

createRoomBtn.addEventListener("click", () => {
  createRoomModal.classList.remove("hidden");
});

cancelCreateRoom.addEventListener("click", () => {
  createRoomModal.classList.add("hidden");
});

confirmCreateRoom.addEventListener("click", () => {
  const roomName = document.getElementById("roomNameInput").value.trim();
  if (!roomName) {
    alert("กรุณาใส่ชื่อห้องก่อน!");
    return;
  }

  console.log("สร้างห้อง:", roomName);
  // TODO: เรียก API เพื่อสร้างห้องใน database
  createRoomModal.classList.add("hidden");
});

const roomListEl = document.getElementById("roomList");
let rooms = [];

function renderRooms() {
  roomListEl.innerHTML = "";
  rooms.forEach(room => {
    const div = document.createElement("div");
    div.className = "room-item";
    div.innerHTML = `
      <span>${room.name}</span>
      <button onclick="joinRoom('${room.name}')">Join</button>
    `;
    roomListEl.appendChild(div);
  });
}

function joinRoom(roomName) {
  window.location.href = `chat_room.html?room=${encodeURIComponent(roomName)}`;
}

confirmCreateRoom.addEventListener("click", () => {
  const roomName = document.getElementById("roomNameInput").value.trim();
  if (!roomName) {
    alert("กรุณาใส่ชื่อห้องก่อน!");
    return;
  }
  rooms.push({ name: roomName });
  renderRooms();
  createRoomModal.classList.add("hidden");
});
