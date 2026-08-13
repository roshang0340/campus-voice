import "dotenv/config";
import express from "express";
import Database from "better-sqlite3";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { OAuth2Client } from "google-auth-library";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isVercel = process.env.VERCEL === "1" || !!process.env.VERCEL;
const dbPath = isVercel ? path.join("/tmp", "campus_voice.db") : "campus_voice.db";

if (isVercel && !fs.existsSync(dbPath)) {
  const possibleSrcs = [
    path.join(process.cwd(), "campus_voice.db"),
    path.join(__dirname, "campus_voice.db"),
    path.join(__dirname, "..", "campus_voice.db")
  ];
  for (const src of possibleSrcs) {
    if (fs.existsSync(src)) {
      try {
        fs.copyFileSync(src, dbPath);
        break;
      } catch (e) {
        console.error("Failed to copy SQLite database to /tmp from", src, e);
      }
    }
  }
}

let db: any;
try {
  db = new Database(dbPath);
} catch (err) {
  console.warn("Failed to open SQLite db file, falling back to :memory: SQLite database", err);
  try {
    db = new Database(":memory:");
  } catch (e) {
    console.error("Could not instantiate Database", e);
  }
}

const JWT_SECRET = process.env.JWT_SECRET || "campus-voice-secret-key";

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL, -- 'student', 'institution', 'admin'
    department TEXT, -- Only for institution role
    name TEXT
  );

  CREATE TABLE IF NOT EXISTS complaints (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER,
    category TEXT NOT NULL,
    priority TEXT NOT NULL, -- 'Low', 'Medium', 'High', 'Critical'
    description TEXT NOT NULL,
    photo_url TEXT,
    status TEXT DEFAULT 'Registered', -- 'Registered', 'Under Review', 'Action In Progress', 'Action Taken'
    response TEXT,
    rating INTEGER,
    is_viewed INTEGER DEFAULT 0,
    viewed_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS otps (
    email TEXT PRIMARY KEY,
    otp TEXT NOT NULL,
    expires_at DATETIME NOT NULL
  );
`);

try {
  db.exec("ALTER TABLE complaints ADD COLUMN is_viewed INTEGER DEFAULT 0");
} catch (e) {
  // Column already exists, safe to ignore
}

try {
  db.exec("ALTER TABLE complaints ADD COLUMN viewed_by TEXT");
} catch (e) {
  // Column already exists, safe to ignore
}

// Seed Admin if not exists
const adminExists = db.prepare("SELECT * FROM users WHERE role = 'admin'").get();
if (!adminExists) {
  const hashedPassword = bcrypt.hashSync("admin123", 10);
  db.prepare("INSERT INTO users (email, password, role, name) VALUES (?, ?, ?, ?)").run(
    "admin@campusvoice.com",
    hashedPassword,
    "admin",
    "System Admin"
  );
}

// Seed some departments if not exists
const depts = ["Canteen", "Hostel", "Faculty", "Infrastructure", "Maintenance", "Other"];
depts.forEach(dept => {
  const deptEmail = `${dept.toLowerCase()}@campusvoice.com`;
  const exists = db.prepare("SELECT * FROM users WHERE email = ?").get(deptEmail);
  if (!exists) {
    const hashedPassword = bcrypt.hashSync("dept123", 10);
    db.prepare("INSERT INTO users (email, password, role, department, name) VALUES (?, ?, ?, ?, ?)").run(
      deptEmail,
      hashedPassword,
      "institution",
      dept,
      `${dept} Department`
    );
  }
});

const app = express();
app.use(express.json());

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = isVercel ? path.join("/tmp", "uploads") : "uploads";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });
const staticUploadsDir = isVercel ? path.join("/tmp", "uploads") : "uploads";
if (!fs.existsSync(staticUploadsDir)) {
  fs.mkdirSync(staticUploadsDir, { recursive: true });
}
app.use("/uploads", express.static(staticUploadsDir));

// Middleware: Auth
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// API Routes
app.post("/api/register", (req, res) => {
  const { email, password, name } = req.body;
  try {
    const hashedPassword = bcrypt.hashSync(password, 10);
    const info = db.prepare("INSERT INTO users (email, password, role, name) VALUES (?, ?, ?, ?)").run(
      email,
      hashedPassword,
      "student",
      name
    );
    res.status(201).json({ id: info.lastInsertRowid });
  } catch (error) {
    res.status(400).json({ error: "Email already exists" });
  }
});

app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  const user: any = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role, department: user.department }, JWT_SECRET);
  res.json({ token, user: { id: user.id, email: user.email, role: user.role, department: user.department, name: user.name } });
});

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || "");

app.post("/api/google", async (req, res) => {
  const { credential, isMock, email: mockEmail, name: mockName } = req.body;

  try {
    let email: string | undefined;
    let name: string | undefined;

    if (isMock) {
      email = mockEmail || "mock.student@campusvoice.com";
      name = mockName || "Mock Student";
    } else {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      if (!payload) return res.status(400).json({ error: "Invalid token" });
      email = payload.email;
      name = payload.name;
    }

    if (!email) return res.status(400).json({ error: "Email is required" });

    let user: any = db.prepare("SELECT * FROM users WHERE email = ?").get(email);

    if (!user) {
      // Register user automatically as a student
      const hashedPassword = bcrypt.hashSync(Math.random().toString(36), 10);
      const info = db.prepare("INSERT INTO users (email, password, role, name) VALUES (?, ?, ?, ?)").run(
        email,
        hashedPassword,
        "student",
        name || email.split("@")[0]
      );
      user = db.prepare("SELECT * FROM users WHERE id = ?").get(info.lastInsertRowid);
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, department: user.department }, JWT_SECRET);
    res.json({ token, user: { id: user.id, email: user.email, role: user.role, department: user.department, name: user.name } });
  } catch (err: any) {
    console.error("Google login error", err);
    res.status(400).json({ error: "Google authentication failed" });
  }
});

import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendOTPEmail(email: string, otp: string) {
  const mailOptions = {
    from: process.env.SMTP_FROM || "Campus Voice <noreply@campusvoice.com>",
    to: email,
    subject: "Campus Voice - Password Reset OTP",
    text: `Your OTP for password reset is: ${otp}. It will expire in 10 minutes.`,
    html: `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #059669;">Campus Voice</h2>
        <p>You requested a password reset. Use the following OTP to proceed:</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #111; margin: 20px 0;">${otp}</div>
        <p style="color: #666; font-size: 14px;">This OTP will expire in 10 minutes.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #999; font-size: 12px;">If you didn't request this, please ignore this email.</p>
      </div>
    `,
  };

  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      await transporter.sendMail(mailOptions);
      console.log(`OTP email sent to ${email}`);
    } catch (error) {
      console.error("Error sending email:", error);
      console.log(`FALLBACK: OTP for ${email} is ${otp}`);
    }
  } else {
    console.log(`SMTP not configured. OTP for ${email} is ${otp}`);
  }
}

app.post("/api/forgot-password", async (req, res) => {
  const { email } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expires_at = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  db.prepare("INSERT OR REPLACE INTO otps (email, otp, expires_at) VALUES (?, ?, ?)").run(email, otp, expires_at);

  await sendOTPEmail(email, otp);
  res.json({ message: "OTP sent successfully" });
});

app.post("/api/reset-password", (req, res) => {
  const { email, otp, newPassword } = req.body;
  
  const otpData: any = db.prepare("SELECT * FROM otps WHERE email = ?").get(email);
  if (!otpData || otpData.otp !== otp || new Date(otpData.expires_at) < new Date()) {
    return res.status(400).json({ error: "Invalid or expired OTP" });
  }

  const hashedPassword = bcrypt.hashSync(newPassword, 10);
  db.prepare("UPDATE users SET password = ? WHERE email = ?").run(hashedPassword, email);
  db.prepare("DELETE FROM otps WHERE email = ?").run(email);

  res.json({ message: "Password reset successful" });
});

// Complaints
app.post("/api/complaints", authenticateToken, upload.single("photo"), (req: any, res) => {
  const { category, priority, description } = req.body;
  const photo_url = req.file ? `/uploads/${req.file.filename}` : null;
  const student_id = req.user.id;

  const info = db.prepare(
    "INSERT INTO complaints (student_id, category, priority, description, photo_url) VALUES (?, ?, ?, ?, ?)"
  ).run(student_id, category, priority, description, photo_url);

  res.status(201).json({ id: info.lastInsertRowid });
});

app.get("/api/complaints", authenticateToken, (req: any, res) => {
  let complaints;
  if (req.user.role === "student") {
    complaints = db.prepare("SELECT * FROM complaints WHERE student_id = ? ORDER BY created_at DESC").all(req.user.id);
  } else if (req.user.role === "institution") {
    complaints = db.prepare("SELECT * FROM complaints WHERE category = ? ORDER BY (response IS NOT NULL AND response != '') ASC, CASE WHEN (response IS NULL OR response = '') THEN created_at END ASC, created_at DESC").all(req.user.department);
  } else if (req.user.role === "admin") {
    complaints = db.prepare("SELECT * FROM complaints ORDER BY (response IS NOT NULL AND response != '') ASC, CASE WHEN (response IS NULL OR response = '') THEN created_at END ASC, created_at DESC").all();
  }
  res.json(complaints);
});

app.patch("/api/complaints/:id", authenticateToken, (req: any, res) => {
  const { status, response, rating } = req.body;
  const { id } = req.params;

  if (req.user.role === "institution" || req.user.role === "admin") {
    if (status) {
      const viewerName = req.user.name || (req.user.role === "admin" ? "System Admin" : `${req.user.department || "Institution"} Department`);
      db.prepare("UPDATE complaints SET status = ?, response = ?, updated_at = CURRENT_TIMESTAMP, is_viewed = 1, viewed_by = COALESCE(viewed_by, ?) WHERE id = ?").run(status, response, viewerName, id);
    }
  } else if (req.user.role === "student") {
    if (rating) {
      db.prepare("UPDATE complaints SET rating = ? WHERE id = ? AND student_id = ?").run(rating, id, req.user.id);
    }
  }
  res.json({ success: true });
});

app.patch("/api/complaints/:id/view", authenticateToken, (req: any, res) => {
  const { id } = req.params;
  const role = req.user.role;

  if (role === "admin" || role === "institution") {
    const viewerName = req.user.name || (role === "admin" ? "System Admin" : `${req.user.department || "Institution"} Department`);
    db.prepare("UPDATE complaints SET is_viewed = 1, viewed_by = COALESCE(viewed_by, ?) WHERE id = ?").run(viewerName, id);
    res.json({ success: true, viewed_by: viewerName });
  } else {
    res.sendStatus(403);
  }
});

app.patch("/api/users/profile", authenticateToken, (req: any, res) => {
  const { name, currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  try {
    if (name) {
      db.prepare("UPDATE users SET name = ? WHERE id = ?").run(name, userId);
    }

    if (newPassword) {
      const user: any = db.prepare("SELECT password FROM users WHERE id = ?").get(userId);
      if (currentPassword && bcrypt.compareSync(currentPassword, user.password)) {
        const hashedNewPassword = bcrypt.hashSync(newPassword, 10);
        db.prepare("UPDATE users SET password = ? WHERE id = ?").run(hashedNewPassword, userId);
      } else {
        return res.status(400).json({ error: "Invalid current password" });
      }
    }

    const updatedUser: any = db.prepare("SELECT id, email, role, department, name FROM users WHERE id = ?").get(userId);
    res.json({ user: updatedUser });
  } catch (error: any) {
    console.error("Profile update error", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// Analytics
app.get("/api/analytics", authenticateToken, (req: any, res) => {
  if (req.user.role !== "admin" && req.user.role !== "institution") return res.sendStatus(403);

  const stats: any = {};
  
  if (req.user.role === "admin") {
    stats.total = db.prepare("SELECT COUNT(*) as count FROM complaints").get().count;
    stats.byStatus = db.prepare("SELECT status, COUNT(*) as count FROM complaints GROUP BY status").all();
    stats.byCategory = db.prepare("SELECT category, COUNT(*) as count FROM complaints GROUP BY category").all();
    stats.byPriority = db.prepare("SELECT priority, COUNT(*) as count FROM complaints GROUP BY priority").all();
  } else {
    const dept = req.user.department;
    stats.total = db.prepare("SELECT COUNT(*) as count FROM complaints WHERE category = ?").get(dept).count;
    stats.byStatus = db.prepare("SELECT status, COUNT(*) as count FROM complaints WHERE category = ? GROUP BY status").all(dept);
    stats.byPriority = db.prepare("SELECT priority, COUNT(*) as count FROM complaints WHERE category = ? GROUP BY priority").all(dept);
  }

  res.json(stats);
});

async function startServer() {
  const PORT = 3000;

  if (process.env.NODE_ENV !== "production" && !isVercel) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

if (!isVercel) {
  startServer();
}

export default app;
