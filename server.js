require("dotenv").config({ path: "./.env" });

const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const allowedOrigins = [
  "http://localhost:3000",
  "https://beyondz-nexus.onrender.com",
  "https://academy-website-nvkh.onrender.com",
  "https://factory-sales-website.onrender.com",
  "https://investment-management-o8z5.onrender.com"
];

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

function createToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function setAuthCookie(res, token) {
  res.cookie("bn_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
}

function requireAuth(req, res, next) {
  const token = req.cookies.bn_token;

  if (!token) {
    return res.status(401).json({ success: false, message: "Not logged in" });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ success: false, message: "Admin only" });
  }

  next();
}

app.post("/api/register", async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required."
      });
    }

    const existing = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "This email is already registered."
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, status)
       VALUES ($1, $2, $3, 'user', 'active')
       RETURNING id, name, email, role, status`,
      [name, email, passwordHash]
    );

    res.json({
      success: true,
      user: result.rows[0]
    });

  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({
      success: false,
      message: "Registration failed."
    });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password."
      });
    }

    const user = result.rows[0];

    if (user.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Your account is not active."
      });
    }

    const passwordOk = await bcrypt.compare(password, user.password_hash);

    if (!passwordOk) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password."
      });
    }

    const token = createToken(user);
    setAuthCookie(res, token);

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isAdmin: user.role === "admin"
      }
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({
      success: false,
      message: "Login failed."
    });
  }
});

app.get("/api/me", requireAuth, async (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      isAdmin: req.user.role === "admin"
    }
  });
});

app.post("/api/logout", (req, res) => {
  res.clearCookie("bn_token");
  res.json({ success: true });
});

app.get("/api/app-statuses", requireAuth, async (req, res) => {
  const result = await pool.query(
    "SELECT app_id, app_name, status FROM app_statuses ORDER BY id"
  );

  res.json({
    success: true,
    statuses: result.rows
  });
});

app.put("/api/app-statuses/:appId", requireAuth, requireAdmin, async (req, res) => {
  const appId = req.params.appId;
  const status = req.body.status;

  if (!["active", "maintenance"].includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Invalid status."
    });
  }

  const result = await pool.query(
    `UPDATE app_statuses
     SET status = $1, updated_at = CURRENT_TIMESTAMP
     WHERE app_id = $2
     RETURNING app_id, app_name, status`,
    [status, appId]
  );

  res.json({
    success: true,
    app: result.rows[0]
  });
});

app.listen(PORT, () => {
  console.log(`BeyondZ Nexus running on port ${PORT}`);
});

app.get("/api/db-test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({
      success: true,
      time: result.rows[0]
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});