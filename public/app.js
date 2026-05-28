const apps = [
  {
    id: "tuition",
    title: "Tuition Platform",
    description: "Manage lessons, students, quizzes and exams.",
    url: "https://academy-website-nvkh.onrender.com/"
  },
  {
    id: "shop",
    title: "E-commerce Store",
    description: "Manage products, orders, payments and customers.",
    url: "https://factory-sales-website.onrender.com/shop.html"
  },
  {
    id: "salary",
    title: "Salary Manager",
    description: "Track income, expenses, savings and future plans.",
    url: "https://investment-management-o8z5.onrender.com"
  }
];

async function login() {
  const email = document.getElementById("email")?.value;
  const password = document.getElementById("password")?.value;
  const message = document.getElementById("message");

  if (!email || !password) {
    message.textContent = "Please enter email and password.";
    return;
  }

  try {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        password
      })
    });

    const data = await response.json();

    if (!data.success) {
      message.textContent = "Invalid login.";
      return;
    }

    localStorage.setItem(
      "centralUser",
      JSON.stringify(data.user)
    );

    window.location.href = "dashboard.html";

  } catch (err) {
    console.error(err);
    message.textContent = "Login failed.";
  }
}

function logout() {
  localStorage.removeItem("centralUser");
  window.location.href = "index.html";
}

function getAppStatuses() {
  return JSON.parse(localStorage.getItem("appStatuses")) || {
    tuition: "active",
    shop: "active",
    salary: "active"
  };
}

function saveAppStatuses(statuses) {
  localStorage.setItem("appStatuses", JSON.stringify(statuses));
}

function renderApps() {
  const grid = document.getElementById("appGrid");
  if (!grid) return;

  const statuses = getAppStatuses();

  grid.innerHTML = apps.map(app => {
    const status = statuses[app.id] || "active";

    if (status === "maintenance") {
      return `
        <div class="app-card">
          <h3>${app.title}</h3>
          <p>${app.description}</p>
          <div class="maintenance-box">
            This website is currently under maintenance. Please try again later.
          </div>
        </div>
      `;
    }

    return `
      <a class="app-card" href="${app.url}">
        <h3>${app.title}</h3>
        <p>${app.description}</p>
      </a>
    `;
  }).join("");
}

function renderAdminStatusPanel() {
  const box = document.getElementById("adminStatusList");
  const panel = document.querySelector(".admin-panel");

  if (!box || !panel) return;

  const user = JSON.parse(localStorage.getItem("centralUser") || "{}");

  if (!user.isAdmin) {
    panel.style.display = "none";
    return;
  }

  panel.style.display = "block";

  const statuses = getAppStatuses();

  box.innerHTML = apps.map(app => `
    <div class="admin-status-row">
      <strong>${app.title}</strong>

      <select onchange="updateAppStatus('${app.id}', this.value)">
        <option value="active" ${statuses[app.id] === "active" ? "selected" : ""}>Active</option>
        <option value="maintenance" ${statuses[app.id] === "maintenance" ? "selected" : ""}>Under Maintenance</option>
      </select>
    </div>
  `).join("");
}

function updateAppStatus(appId, status) {
  const statuses = getAppStatuses();
  statuses[appId] = status;
  saveAppStatuses(statuses);

  renderApps();
  renderAdminStatusPanel();
}

if (window.location.pathname.includes("dashboard.html")) {
  const user = localStorage.getItem("centralUser");

  if (!user) {
    window.location.href = "index.html";
  }

  renderApps();
  renderAdminStatusPanel();
}

function getRegisteredUsers() {
  return JSON.parse(localStorage.getItem("registeredUsers")) || [];
}

function saveRegisteredUsers(users) {
  localStorage.setItem("registeredUsers", JSON.stringify(users));
}

function register() {
  const name = document.getElementById("name")?.value.trim();
  const email = document.getElementById("email")?.value.trim().toLowerCase();
  const password = document.getElementById("password")?.value;
  const confirmPassword = document.getElementById("confirmPassword")?.value;
  const message = document.getElementById("message");

  if (!name || !email || !password || !confirmPassword) {
    message.textContent = "Please fill all fields.";
    return;
  }

  if (password !== confirmPassword) {
    message.textContent = "Passwords do not match.";
    return;
  }

  const users = getRegisteredUsers();

  const exists = users.some(user => user.email === email);

  if (exists) {
    message.textContent = "This email is already registered.";
    return;
  }

  users.push({
    name,
    email,
    password,
    isAdmin: false
  });

  saveRegisteredUsers(users);

  message.textContent = "Account created successfully. Redirecting to login...";

  setTimeout(() => {
    window.location.href = "index.html";
  }, 1200);
}