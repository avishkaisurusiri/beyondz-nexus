let apps = [];

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

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

async function login() {
  const email = document.getElementById("email")?.value.trim().toLowerCase();
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
      credentials: "include",
      body: JSON.stringify({
        email,
        password
      })
    });

    const data = await response.json();

    if (!data.success) {
      message.textContent = data.message || "Login failed.";
      return;
    }

    localStorage.setItem(
      "centralUser",
      JSON.stringify(data.user)
    );

    message.textContent = "Login successful.";

    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 1000);

  } catch (err) {
    console.error(err);
    message.textContent = "Login failed.";
  }
}

async function logout() {
  try {
    await fetch("/api/logout", {
      method: "POST",
      credentials: "include"
    });
  } catch (err) {
    console.error("Logout failed:", err);
  }

  localStorage.removeItem("centralUser");
  window.location.href = "dashboard.html";
}


function renderApps() {
  const grid = document.getElementById("appGrid");
  if (!grid) return;

  grid.innerHTML = apps.map(app => {
    if (app.status === "maintenance") {
      return `
        <div class="app-card">
          <h3>${escapeHtml(app.title)}</h3>
          <p>${escapeHtml(app.description)}</p>
          <div class="maintenance-box">
            This website is currently under maintenance. Please try again later.
          </div>
        </div>
      `;
    }

    return `
      <a class="app-card" href="${escapeHtml(app.url)}" target="_blank">
        <h3>${escapeHtml(app.title)}</h3>
        <p>${escapeHtml(app.description)}</p>
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
      <div>
        <strong>${escapeHtml(app.title)}</strong>
        <p>${escapeHtml(app.url)}</p>
      </div>

      <select onchange="updateAppStatus('${app.id}', this.value)">
        <option value="active" ${app.status === "active" ? "selected" : ""}>Active</option>
        <option value="maintenance" ${app.status === "maintenance" ? "selected" : ""}>Under Maintenance</option>
      </select>

      <button onclick="deletePortalApp('${app.id}')">Remove</button>
    </div>
  `).join("");
}

async function loadPortalApps() {
  try {
    const response = await fetch("/api/portal-apps", {
      credentials: "include"
    });

    const data = await response.json();

    if (!data.success) return;

    apps = data.apps;
  } catch (err) {
    console.error("Failed to load portal apps:", err);
  }
}

async function addPortalApp() {
  const title = document.getElementById("newAppTitle")?.value.trim();
  const url = document.getElementById("newAppUrl")?.value.trim();
  const description = document.getElementById("newAppDescription")?.value.trim();

  if (!title || !url) {
    alert("Website name and link are required.");
    return;
  }

  const response = await fetch("/api/portal-apps", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    credentials: "include",
    body: JSON.stringify({ title, url, description })
  });

  const data = await response.json();

  if (!data.success) {
    alert(data.message || "Failed to add website.");
    return;
  }

  document.getElementById("newAppTitle").value = "";
  document.getElementById("newAppUrl").value = "";
  document.getElementById("newAppDescription").value = "";

  await loadPortalApps();
  renderApps();
  renderAdminStatusPanel();
}

async function updateAppStatus(appId, status) {
  const response = await fetch(`/api/portal-apps/${appId}/status`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    credentials: "include",
    body: JSON.stringify({ status })
  });

  const data = await response.json();

  if (!data.success) {
    alert(data.message || "Failed to update status.");
    return;
  }

  await loadPortalApps();
  renderApps();
  renderAdminStatusPanel();
}

async function deletePortalApp(appId) {
  if (!confirm("Remove this website from the portal?")) return;

  const response = await fetch(`/api/portal-apps/${appId}`, {
    method: "DELETE",
    credentials: "include"
  });

  const data = await response.json();

  if (!data.success) {
    alert(data.message || "Failed to remove website.");
    return;
  }

  await loadPortalApps();
  renderApps();
  renderAdminStatusPanel();
}


async function updateTopActions() {
  const adminLink = document.getElementById("adminLink");
  const loginLink = document.getElementById("loginLink");
  const registerLink = document.getElementById("registerLink");
  const logoutBtn = document.getElementById("logoutBtn");

  if (adminLink) adminLink.style.display = "none";
  if (logoutBtn) logoutBtn.style.display = "none";
  if (loginLink) loginLink.style.display = "inline-block";
  if (registerLink) registerLink.style.display = "inline-block";

  try {
    const response = await fetch("/api/me", {
      credentials: "include"
    });

    const data = await response.json();

    if (!data.success) return;

    if (loginLink) loginLink.style.display = "none";
    if (registerLink) registerLink.style.display = "none";
    if (logoutBtn) logoutBtn.style.display = "inline-block";

    if (data.user?.isAdmin && adminLink) {
      adminLink.style.display = "inline-block";
    }
  } catch (err) {
    console.error("User check failed:", err);
  }
}

const isDashboardPage =
  window.location.pathname === "/" ||
  window.location.pathname.includes("dashboard.html");

const isAdminPage =
  window.location.pathname.includes("admin.html");

if (isDashboardPage || isAdminPage) {
  loadPortalApps().then(async () => {
    renderApps();

    if (isDashboardPage) {
      await updateTopActions();
    }

    if (isAdminPage) {
      renderAdminStatusPanel();
    }
  });
}
