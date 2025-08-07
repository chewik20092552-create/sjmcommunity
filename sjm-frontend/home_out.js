const texts = [
  "ที่นี่ไม่ใช่ห้องเรียนแต่เป็นพื้นที่เล็กๆที่เราสร้างขึ้นมาเพื่อทุกคนที่อยากเม้าท์ deeptalk ระบาย หรือขอคำปรึกษาแบบไม่ต้องเกรงใจใคร!",
  "ไม่มีครู ไม่มีเกรด มีแค่ความจริงใจ และมิตรภาพป่วน ๆ ที่รอให้คุณเข้ามาแชร์"
];

const ids = ["type_ex_1", "type_ex_2"];
const delay = 40;
let currentText = 0;
let currentChar = 0;

function typeSmooth() {
  if (currentText >= texts.length) return;

  const target = document.getElementById(ids[currentText]);

  if (currentChar < texts[currentText].length) {
    const span = document.createElement("span");
    span.textContent = texts[currentText].charAt(currentChar);
    span.style.opacity = 0;
    span.style.transition = "opacity 0.3s ease";
    target.appendChild(span);

    requestAnimationFrame(() => {
      span.style.opacity = 1;
    });

    currentChar++;
    setTimeout(typeSmooth, delay);
  } else {
    currentText++;
    currentChar = 0;
    setTimeout(typeSmooth, 400);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  typeSmooth();
});

document.addEventListener("DOMContentLoaded", () => {
  const loginButton = document.getElementById("login_button");
  const modal = document.getElementById("loginModal");
  const closeModal = document.getElementById("close_modal");

  const registerModal = document.getElementById("register_modal");
  const closeRegister = document.getElementById("close_register");
  const showRegister = document.getElementById("show_register");
  const backToLogin = document.getElementById("back_to_login");

  // เปิด login modal
  loginButton.addEventListener("click", (e) => {
    e.preventDefault();
    const inputs = modal.querySelectorAll("input");
    inputs.forEach(input => input.value = "");
    registerModal.classList.add("hidden");
    modal.classList.remove("hidden");
  });

  // ปิด login modal
  closeModal.addEventListener("click", () => {
    modal.classList.add("hidden");
  });

  // เปิด register modal
  showRegister.addEventListener("click", (e) => {
    e.preventDefault();
    const inputs = registerModal.querySelectorAll("input");
    inputs.forEach(input => input.value = "");
    modal.classList.add("hidden");
    registerModal.classList.remove("hidden");
  });

  // ปิด register modal
  closeRegister.addEventListener("click", () => {
    registerModal.classList.add("hidden");
  });

  // กลับไป login modal
  backToLogin.addEventListener("click", (e) => {
    e.preventDefault();
    registerModal.classList.add("hidden");
    const inputs = modal.querySelectorAll("input");
    inputs.forEach(input => input.value = "");
    modal.classList.remove("hidden");
  });

  // ฟังก์ชัน toggle รหัสผ่าน
  function setupPasswordToggle(buttonId, inputId) {
    const btn = document.getElementById(buttonId);
    const input = document.getElementById(inputId);

    btn.addEventListener("click", () => {
      if (input.type === "password") {
        input.type = "text";
        btn.textContent = "Hide";
      } else {
        input.type = "password";
        btn.textContent = "Show";
      }
    });
  }

  setupPasswordToggle("toggleLoginPassword", "login_password");
  setupPasswordToggle("toggleRegisterPassword", "register_password");
  setupPasswordToggle("toggleRegisterConfirm", "register_confirm_password");
});

function showError(targetInputId, message) {
  let existing = document.querySelector(`#${targetInputId} + .error-msg`);
  if (!existing) {
    const p = document.createElement("p");
    p.className = "error-msg";
    p.style.color = "red";
    p.style.fontSize = "14px";
    p.style.marginTop = "5px";
    document.getElementById(targetInputId).insertAdjacentElement("afterend", p);
    existing = p;
  }
  existing.textContent = message;
}

function clearErrors() {
  document.querySelectorAll('.error-msg').forEach(e => e.remove());
}

// LOGIN
document.querySelector('#loginModal button:last-of-type').addEventListener('click', async () => {
  clearErrors();

  const studentId = document.getElementById('login_username').value;
  const password = document.getElementById('login_password').value;

  try {
    const res = await fetch('https://postgres-production-ed5c.up.railway.app/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, password })
    });

    const data = await res.json();

    if (res.ok && data.token) {
      // ✅ บันทึก token ก่อน แล้วค่อย redirect
      localStorage.setItem('token', data.token);

      // ✅ เพื่อความชัวร์ รอให้ token set เสร็จก่อน redirect
      setTimeout(() => {
        window.location.href = "home_in.html";
      }, 100); // รอ 100ms
    } else {
      if (data.message.includes('ไม่พบ')) {
        showError('login_username', data.message);
      } else {
        showError('login_password', data.message);
      }
    }
  } catch (err) {
    console.error("Login Error:", err);
  }
});

// REGISTER
document.querySelector('#register_modal button:last-of-type').addEventListener('click', async () => {
  clearErrors();

  const username = document.getElementById('register_username').value;
  const studentId = document.getElementById('register_student_id').value;
  const password = document.getElementById('register_password').value;
  const confirm = document.getElementById('register_confirm_password').value;

  if (!username || !studentId || !password || !confirm) {
    if (!username) showError('register_username', "กรุณากรอกชื่อผู้ใช้");
    if (!studentId) showError('register_student_id', "กรุณากรอกรหัสนักเรียน");
    if (!password) showError('register_password', "กรุณากรอกรหัสผ่าน");
    if (!confirm) showError('register_confirm_password', "กรุณายืนยันรหัสผ่าน");
    return;
  }

  if (password !== confirm) {
    showError('register_confirm_password', "รหัสผ่านไม่ตรงกัน");
    return;
  }

  const res = await fetch('https://postgres-production-ed5c.up.railway.app/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, studentId, password })
  });

  const data = await res.json();

  if (res.ok) {
    document.getElementById('register_modal').classList.add('hidden');
    document.getElementById('loginModal').classList.remove('hidden');
  } else {
    if (data.message.includes("บัญชีนี้")) {
      showError('register_student_id', data.message);
    } else {
      showError('register_username', data.message);
    }
  }
});
.then(data => {
  if (data.token) {
    localStorage.setItem('token', data.token); // ⬅️ บันทึก token
    window.location.href = 'home_in.html';     // ⬅️ ไปหน้า login สำเร็จ
  } else {
    console.log(data.message || 'เข้าสู่ระบบล้มเหลว');
  }
});

