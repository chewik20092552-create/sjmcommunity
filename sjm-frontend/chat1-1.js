document.addEventListener('DOMContentLoaded', () => {
  const profileButton = document.getElementById('profile_button');

  profileButton.addEventListener('click', async () => {
    const token = localStorage.getItem('token');

    const res = await fetch('http://localhost:5000/api/profile', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (res.status === 200) {
      const data = await res.json();
      document.getElementById('profileUsername').innerText = data.username;
      document.getElementById('profileStudentId').innerText = data.studentId;
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