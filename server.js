require("dotenv").config({ path: ".env" });

const express = require("express");
const path = require("path");

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.post("/api/login", (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");

  const adminEmail = String(process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const adminPassword = String(process.env.ADMIN_PASSWORD || "");

  const isAdmin = email === adminEmail && password === adminPassword;

  console.log("Login email:", email);
  console.log("Admin email from env:", adminEmail);
  console.log("Is admin:", isAdmin);

  res.json({
    success: true,
    user: {
      email,
      isAdmin
    }
  });
});

app.listen(3000, () => {
  console.log("Central portal running on http://localhost:3000");
});