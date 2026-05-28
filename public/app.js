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

let appStatuses = {
  tuition: "active",
  shop: "active",
  salary: "active"
};

async function register() {
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

  try {
    const response = await fetch("/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name,
        email,
        password
      })
    });

    const data = await response.json();

    if (!data.success) {
      message.textContent = data.message || "Registration failed.";
      return;
    }

    message.textContent = "Account created successfully.";

    setTimeout(() => {
      window.location.href = "index.html";
    }, 1200);

  } catch (err) {
    console.error(err);
    message.textContent = "Registration failed.";
  }
}

function logout() {
  localStorage.removeItem("centralUser");
  window.location.href = "index.html";
}


function renderApps() {
  const grid = document.getElementById("appGrid");
  if (!grid) return;

  grid.innerHTML = apps.map(app => {
    const status = appStatuses[app.id] || "active";

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

  box.innerHTML = apps.map(app => `
    <div class="admin-status-row">
      <strong>${app.title}</strong>

      <select onchange="updateAppStatus('${app.id}', this.value)">
        <option value="active" ${appStatuses[app.id] === "active" ? "selected" : ""}>
          Active
        </option>
        <option value="maintenance" ${appStatuses[app.id] === "maintenance" ? "selected" : ""}>
          Under Maintenance
        </option>
      </select>
    </div>
  `).join("");
}

async function updateAppStatus(appId, status) {
  try {
    const response = await fetch(`/api/app-statuses/${appId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include",
      body: JSON.stringify({ status })
    });

    const data = await response.json();

    if (!data.success) {
      alert(data.message || "Failed to update app status.");
      return;
    }

    appStatuses[appId] = data.app.status;

    renderApps();
    renderAdminStatusPanel();

  } catch (err) {
    console.error(err);
    alert("Failed to update app status.");
  }
}

async function loadAppStatuses() {
  try {
    const response = await fetch("/api/app-statuses", {
      credentials: "include"
    });

    const data = await response.json();

    if (!data.success) {
      return;
    }

    data.statuses.forEach(item => {
      appStatuses[item.app_id] = item.status;
    });

  } catch (err) {
    console.error("Failed to load app statuses:", err);
  }
}

if (window.location.pathname.includes("dashboard.html")) {
  const user = localStorage.getItem("centralUser");

  if (!user) {
    window.location.href = "index.html";
  }

  loadAppStatuses().then(() => {
    renderApps();
    renderAdminStatusPanel();
  });
}
