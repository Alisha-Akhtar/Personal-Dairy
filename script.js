// ---------- Utility: users stored as array under "diary_users" ----------
const USERS_KEY = "diary_users";

function loadUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function findUserByName(username) {
  if (!username) return null;
  const users = loadUsers();
  return users.find(u => u.username.toLowerCase() === username.toLowerCase()) || null;
}

document.addEventListener("DOMContentLoaded", () => {

  /* ---------- REGISTER ---------- */
  const regForm = document.getElementById("registerForm");
  if (regForm) {
    regForm.addEventListener("submit", (ev) => {
      ev.preventDefault();
      const fullName = document.getElementById("fullName")?.value || "";
      const username = document.getElementById("registerUsername")?.value.trim();
      const password = document.getElementById("registerPassword")?.value;
      const confirm = document.getElementById("confirmPassword")?.value;

      if (!username || !password || !confirm) {
        alert("Please fill all required fields!");
        return;
      }
      if (password !== confirm) {
        alert("Passwords do not match!");
        return;
      }
      if (findUserByName(username)) {
        alert("Username already exists!");
        return;
      }

      const users = loadUsers();
      users.push({ username, password, fullName: fullName || username, entries: [] });
      saveUsers(users);
      alert("Registered successfully!");
      window.location.href = "index.html";
    });
  }

  /* ---------- LOGIN ---------- */
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", (ev) => {
      ev.preventDefault();
      const username = document.getElementById("loginUsername")?.value.trim();
      const password = document.getElementById("loginPassword")?.value;

      if (!username || !password) {
        alert("Enter username & password!");
        return;
      }

      const user = findUserByName(username);
      if (!user) {
        alert("User not found!");
        return;
      }
      if (user.password !== password) {
        alert("Incorrect password!");
        return;
      }

      localStorage.setItem("diary_current", user.username);
      alert("Login successful!");
      window.location.href = "home.html";
    });
  }

  /* ---------- FORGOT PASSWORD ---------- */
  const forgotForm = document.getElementById("forgotForm");
  if (forgotForm) {
    forgotForm.addEventListener("submit", (ev) => {
      ev.preventDefault();
      const username = document.getElementById("forgotUsername")?.value.trim();
      const newPass = document.getElementById("newPassword")?.value;
      const confirmNew = document.getElementById("confirmNewPassword")?.value;

      if (!username || !newPass || !confirmNew) {
        alert("Fill all fields!");
        return;
      }
      if (newPass !== confirmNew) {
        alert("Passwords do not match!");
        return;
      }

      const users = loadUsers();
      const idx = users.findIndex(u => u.username.toLowerCase() === username.toLowerCase());
      if (idx === -1) {
        alert("Username not found!");
        return;
      }

      users[idx].password = newPass;
      saveUsers(users);
      alert("Password updated successfully!");
      window.location.href = "index.html";
    });
  }

  /* ---------- HOME PAGE ---------- */
  const userDisplay = document.getElementById("userDisplay");
  if (userDisplay) {
    const current = localStorage.getItem("diary_current");
    if (!current) {
      window.location.href = "index.html";
      return;
    }

    const user = findUserByName(current);
    if (!user) {
      alert("User not found.");
      window.location.href = "index.html";
      return;
    }

    userDisplay.textContent = user.fullName || user.username;

    const entriesList = document.getElementById("entriesList");
    const entryTitle = document.getElementById("entryTitle");
    const entryText = document.getElementById("entryText");
    const moodEl = document.getElementById("mood");
    const entryDate = document.getElementById("entryDate");
    const saveBtn = document.getElementById("saveEntry");
    const searchEl = document.getElementById("search");
    const exportBtn = document.getElementById("exportBtn");
    const logoutBtn = document.getElementById("logoutBtn");
    const toggleTheme = document.getElementById("toggleTheme");

    let entries = user.entries || [];
    let editIndex = null;

    function render(list) {
      entriesList.innerHTML = "";
      if (list.length === 0) {
        entriesList.innerHTML = "<li>No entries yet.</li>";
        return;
      }

      list.forEach((e, i) => {
        const li = document.createElement("li");
        li.innerHTML = `
          <strong>${e.title || "Untitled"}</strong>
          <p>${e.text}</p>
          <small>${e.date} | Mood: ${e.mood}</small>
          <div>
            <button class="edit-btn" data-i="${i}">Edit</button>
            <button class="delete-btn" data-i="${i}">Delete</button>
          </div>`;
        entriesList.appendChild(li);
      });

      // Delete Entry
      document.querySelectorAll(".delete-btn").forEach(b => {
        b.onclick = () => {
          const i = b.dataset.i;
          if (confirm("Delete this entry?")) {
            entries.splice(i, 1);
            saveAllEntries();
            render(entries);
          }
        };
      });

      // Edit Entry
      document.querySelectorAll(".edit-btn").forEach(b => {
        b.onclick = () => {
          const i = b.dataset.i;
          const entry = entries[i];
          entryTitle.value = entry.title;
          entryText.value = entry.text;
          moodEl.value = entry.mood;
          entryDate.value = new Date(entry.date).toISOString().split("T")[0];
          editIndex = i;
          saveBtn.textContent = "Update Entry";
        };
      });
    }

    function saveAllEntries() {
      const users = loadUsers();
      const idx = users.findIndex(u => u.username === user.username);
      users[idx].entries = entries;
      saveUsers(users);
    }

    render(entries);

    saveBtn.onclick = () => {
      const title = entryTitle.value.trim();
      const text = entryText.value.trim();
      const mood = moodEl.value;
      const dt = entryDate.value
        ? new Date(entryDate.value).toLocaleDateString()
        : new Date().toLocaleString();

      if (!text) {
        alert("Please write something!");
        return;
      }

      const newEntry = { title, text, mood, date: dt };

      if (editIndex !== null) {
        entries[editIndex] = newEntry;
        editIndex = null;
        saveBtn.textContent = "Save Entry";
      } else {
        entries.unshift(newEntry);
      }

      saveAllEntries();
      render(entries);
      entryTitle.value = "";
      entryText.value = "";
      entryDate.value = "";
      moodEl.value = "neutral";
    };

    searchEl.oninput = () => {
      const q = searchEl.value.toLowerCase();
      const filtered = entries.filter(e =>
        e.text.toLowerCase().includes(q) ||
        e.title.toLowerCase().includes(q)
      );
      render(filtered);
    };

    exportBtn.onclick = () => {
      if (entries.length === 0) {
        alert("No entries to export!");
        return;
      }

      let content = `My Diary - ${user.username}\n\n`;
      entries.forEach(e => {
        content += `[${e.date}] (${e.mood})\n${e.title}\n${e.text}\n\n`;
      });

      const blob = new Blob([content], { type: "text/plain" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${user.username}_Diary.txt`;
      link.click();
    };

    logoutBtn.onclick = () => {
      localStorage.removeItem("diary_current");
      window.location.href = "index.html";
    };

    toggleTheme.onclick = () => {
      document.body.classList.toggle("dark");
      localStorage.setItem(
        "diary_theme_dark",
        document.body.classList.contains("dark") ? "1" : "0"
      );
    };

    if (localStorage.getItem("diary_theme_dark") === "1") {
      document.body.classList.add("dark");
    }
  }
});
