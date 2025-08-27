document.addEventListener('DOMContentLoaded', () => {
  const profileButton = document.getElementById('profile_button');

  profileButton.addEventListener('click', async () => {
    const token = localStorage.getItem('token');

    const res = await fetch('https://postgres-production-ed5c.up.railway.app/api/profile', {
      headers: {
        Authorization: `Bearer ${token}`
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

document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('token');

  if (!token) {
    return window.location.href = 'home_out.html';
  }

  try {
    const res = await fetch('https://postgres-production-ed5c.up.railway.app/api/profile', {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (res.status !== 200) {
      localStorage.removeItem('token');
      window.location.href = 'home_out.html';
    }
  } catch (err) {
    console.error('Error validating token:', err);
    window.location.href = 'home_out.html';
  }
});

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
