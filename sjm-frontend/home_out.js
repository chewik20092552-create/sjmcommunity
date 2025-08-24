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

// ฟังก์ชันแสดงข้อผิดพลาด
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

// ฟังก์ชันล้างข้อผิดพลาด
function clearErrors() {
  document.querySelectorAll('.error-msg').forEach(e => e.remove());
}

// ตั้งค่าการแสดงผลข้อความแบบพิมพ์ทีละตัว
document.addEventListener("DOMContentLoaded", () => {
  typeSmooth();

  // ตั้งค่า Modal และ Event Listeners
  const loginButton = document.getElementById("login_button");
  const modal = document.getElementById("loginModal");
  const closeModal = document.getElementById("close_modal");

  const registerModal = document.getElementById("register_modal");
  const closeRegister = document.getElementById("close_register");
  const showRegister = document.getElementById("show_register");
  const backToLogin = document.getElementById("back_to_login");

  // เปิด-ปิด Modal
  loginButton?.addEventListener("click", (e) => {
    e.preventDefault();
    modal.querySelectorAll("input").forEach(input => input.value = "");
    registerModal.classList.add("hidden");
    modal.classList.remove("hidden");
  });

  closeModal?.addEventListener("click", () => {
    modal.classList.add("hidden");
  });

  showRegister?.addEventListener("click", (e) => {
    e.preventDefault();
    registerModal.querySelectorAll("input").forEach(input => input.value = "");
    modal.classList.add("hidden");
    registerModal.classList.remove("hidden");
  });

  closeRegister?.addEventListener("click", () => {
    registerModal.classList.add("hidden");
  });

  backToLogin?.addEventListener("click", (e) => {
    e.preventDefault();
    registerModal.classList.add("hidden");
    modal.querySelectorAll("input").forEach(input => input.value = "");
    modal.classList.remove("hidden");
  });

  // ฟังก์ชันสลับแสดง/ซ่อนรหัสผ่าน
  function setupPasswordToggle(buttonId, inputId) {
    const btn = document.getElementById(buttonId);
    const input = document.getElementById(inputId);

    btn?.addEventListener("click", () => {
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

// ระบบล็อกอิน
document.querySelector('#loginModal button:last-of-type')?.addEventListener('click', async (e) => {
  e.preventDefault();
  clearErrors();

  const studentid = document.getElementById('login_username').value.trim();
  const password = document.getElementById('login_password').value;

  // ตรวจสอบข้อมูลพื้นฐาน
  if (!studentid || !password) {
    if (!studentid) showError('login_username', "กรุณากรอกรหัสนักเรียน");
    if (!password) showError('login_password', "กรุณากรอกรหัสผ่าน");
    return;
  }

  try {
    const response = await fetch(`/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentid, password })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = errorData.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ';
      throw new Error(errorMsg);
    }

    const data = await response.json();

    if (data.token) {
      localStorage.setItem('token', data.token);
      window.location.href = "home_in.html";
    } else {
      throw new Error("ไม่ได้รับ Token จากเซิร์ฟเวอร์");
    }
  } catch (err) {
    console.error("Login Error:", err);
    showError('login_username', err.message.includes('ไม่พบ') ? err.message : "เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
  }
});

// ระบบลงทะเบียน
document.querySelector('#register_modal button:last-of-type')?.addEventListener('click', async (e) => {
  e.preventDefault();
  clearErrors();

  const username = document.getElementById('register_username').value.trim();
  const studentid = document.getElementById('register_student_id').value.trim();
  const password = document.getElementById('register_password').value;
  const confirm = document.getElementById('register_confirm_password').value;

  // ตรวจสอบความถูกต้องของข้อมูล
  if (!username || !studentid || !password || !confirm) {
    if (!username) showError('register_username', "กรุณากรอกชื่อผู้ใช้");
    if (!studentid) showError('register_student_id', "กรุณากรอกรหัสนักเรียน");
    if (!password) showError('register_password', "กรุณากรอกรหัสผ่าน");
    if (!confirm) showError('register_confirm_password', "กรุณายืนยันรหัสผ่าน");
    return;
  }

  if (password.length < 8) {
    showError('register_password', "รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร");
    return;
  }

  if (password !== confirm) {
    showError('register_confirm_password', "รหัสผ่านไม่ตรงกัน");
    return;
  }

  try {
    const response = await fetch(`/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, studentid, password })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = errorData.message || 'เกิดข้อผิดพลาดในการลงทะเบียน';
      throw new Error(errorMsg);
    }

    const data = await response.json();
    
    alert("ลงทะเบียนสำเร็จ! กรุณาล็อกอิน");
    document.getElementById('register_modal').classList.add('hidden');
    document.getElementById('loginModal').classList.remove('hidden');

  } catch (err) {
    console.error("Registration Error:", err);
    if (err.message.includes("บัญชีนี้")) {
      showError('register_student_id', err.message);
    } else {
      showError('register_username', err.message || "เกิดข้อผิดพลาดในการลงทะเบียน");
    }
  }
});
