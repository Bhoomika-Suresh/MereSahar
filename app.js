// app.js
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { Pool } from "pg";
import multer from "multer";
import bcrypt from "bcrypt";
import session from "express-session";

dotenv.config();

const app = express();
const port = 3000;

// -------------------- DATABASE --------------------
const db = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: { rejectUnauthorized: false },
});

db.connect()
  .then(client => {
    console.log("Connected to PostgreSQL database.");
    client.release();
  })
  .catch(err => {
    console.error("DB connection error", err);
    process.exit(1);
  });

// -------------------- FILE & SESSION SETUP --------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const storage = multer.memoryStorage();
const upload = multer({ storage });

app.use(
  session({
    secret: process.env.SESSION_SECRET || "supersecret",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// -------------------- MIDDLEWARE --------------------
function isAdminLoggedIn(req, res, next) {
  if (req.session && req.session.admin) {
    next();
  } else {
    res.redirect("/admin/login");
  }
}

// -------------------- ROUTES --------------------

// Home
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "html", "index.html"));
});

// User Dashboard
app.get("/user", async (req, res) => {
  const { category, status, urgency } = req.query;
  try {
    let query = `
      SELECT id, username, category, description, latitude, longitude, status, urgency,
             (image IS NOT NULL) AS has_before,
             (after_image IS NOT NULL) AS has_after
      FROM meresahar
    `;
    const conditions = [];
    const values = [];
    let idx = 1;
    if (category) { conditions.push(`category=$${idx++}`); values.push(category); }
    if (status) { conditions.push(`status=$${idx++}`); values.push(status); }
    if (urgency) { conditions.push(`urgency=$${idx++}`); values.push(urgency); }
    if (conditions.length > 0) query += " WHERE " + conditions.join(" AND ");
    query += " ORDER BY id DESC";
    const result = await db.query(query, values);
    const issues = result.rows.map(row => ({
      ...row,
      status: row.status || "Pending",
      urgency: row.urgency || "Low",
    }));
    res.render("user", { title: "MereSahar Dashboard", issues, req });
  } catch (err) {
    console.error(err.stack);
    res.status(500).send("Database error");
  }
});

// Serve Images
app.get("/images/:id/:type", async (req, res) => {
  const { id, type } = req.params;
  const column = type === "after" ? "after_image" : "image";
  try {
    const result = await db.query(`SELECT ${column} FROM meresahar WHERE id=$1`, [id]);
    if (!result.rows.length || !result.rows[0][column]) return res.status(404).send("No image");
    res.setHeader("Content-Type", "image/png");
    res.send(result.rows[0][column]);
  } catch (err) {
    console.error(err);
    res.status(500).send("DB error");
  }
});

// Submit New Report
app.post("/report", upload.single("image"), async (req, res) => {
  const { username, category, description, latitude, longitude } = req.body;
  const imageBuffer = req.file ? req.file.buffer : null;
  try {
    await db.query(
      `INSERT INTO meresahar (username, category, description, latitude, longitude, image)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [username, category, description.toString(), latitude, longitude, imageBuffer]
    );
    res.redirect("/user");
  } catch (err) {
    console.error(err.stack);
    res.status(500).send("Database error");
  }
});

// -------------------- ADMIN ROUTES --------------------

// Login Page
app.get("/admin/login", (req, res) => {
  res.render("login", { error: null });
});

// Login POST
app.post("/admin/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await db.query("SELECT * FROM users WHERE username=$1 LIMIT 1", [username]);
    if (!result.rows.length) return res.render("login", { error: "Invalid username or password" });

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.render("login", { error: "Invalid username or password" });

    req.session.admin = { id: user.id, username: user.username };
    res.redirect("/admin");
  } catch (err) {
    console.error(err);
    res.render("login", { error: "Database error" });
  }
});

// Logout
app.get("/admin/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/admin/login");
});
// Add User form page (protected)
app.get("/admin/add-user", (req, res) => {
  res.render("adduser", { error: null, admin: req.session.admin });
});

// Handle Add User form submission
app.post("/admin/add-user", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.render("adduser", { error: "Username and password are required", admin: req.session.admin });
  }

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query(
      "INSERT INTO users (username, password_hash) VALUES ($1, $2)",
      [username, hashedPassword]
    );
    res.redirect("/admin"); // redirect to admin dashboard after adding user
  } catch (err) {
    console.error(err);
    res.render("adduser", { error: "Database error or username already exists", admin: req.session.admin });
  }
});


// Admin Dashboard (protected)
app.get("/admin", isAdminLoggedIn, async (req, res) => {
  const { category, status, urgency } = req.query;
  try {
    let query = `
      SELECT id, username, category, description, latitude, longitude, status, urgency,
             (image IS NOT NULL) AS has_before,
             (after_image IS NOT NULL) AS has_after
      FROM meresahar
    `;
    const conditions = [];
    const values = [];
    let idx = 1;
    if (category) { conditions.push(`category=$${idx++}`); values.push(category); }
    if (status) { conditions.push(`status=$${idx++}`); values.push(status); }
    if (urgency) { conditions.push(`urgency=$${idx++}`); values.push(urgency); }
    if (conditions.length > 0) query += " WHERE " + conditions.join(" AND ");
    query += " ORDER BY id DESC";

    const result = await db.query(query, values);
    const issues = result.rows.map(row => ({
      ...row,
      status: row.status || "Pending",
      urgency: row.urgency || "Low",
    }));

    res.render("admin", { issues, admin: req.session.admin });
  } catch (err) {
    console.error(err.stack);
    res.status(500).send("Database error");
  }
});

// Update Issue (protected)
app.post("/admin/update/:id", isAdminLoggedIn, upload.single("after_image"), async (req, res) => {
  const { id } = req.params;
  const { status, urgency } = req.body;
  const afterImageBuffer = req.file ? req.file.buffer : null;
  try {
    if (afterImageBuffer && status === "Completed") {
      await db.query(
        "UPDATE meresahar SET status=$1, urgency=$2, after_image=$3 WHERE id=$4",
        [status, urgency, afterImageBuffer, id]
      );
    } else {
      await db.query("UPDATE meresahar SET status=$1, urgency=$2 WHERE id=$3", [status, urgency, id]);
    }
    res.redirect("/admin");
  } catch (err) {
    console.error(err.stack);
    res.status(500).send("DB error");
  }
});


// Logout route
app.get("/admin/logout", (req, res) => {
  // Destroy the session
  req.session.destroy(err => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).send("Could not log out. Try again.");
    }
    // Redirect to admin login page after logout
    res.redirect("/admin/login");
  });
});


// Enhanced Reports Route
// Enhanced Reports Route (with admin protection and session data)
// Corrected Reports Route matching your database structure
app.get("/admin/reports", isAdminLoggedIn, async (req, res) => {
  try {
    // Get total reports count
    const totalReportsResult = await db.query(`SELECT COUNT(*) FROM meresahar`);
    const totalReports = parseInt(totalReportsResult.rows[0].count);

    // Get category statistics
    const categoryStats = await db.query(`
      SELECT category, COUNT(*) as count 
      FROM meresahar 
      GROUP BY category 
      ORDER BY COUNT(*) DESC
    `);

    // Get status statistics - mapping your actual status values
    const statusStats = await db.query(`
      SELECT 
        COALESCE(status, 'pending') as status, 
        COUNT(*) as count 
      FROM meresahar 
      GROUP BY status
      ORDER BY 
        CASE 
          WHEN status = 'pending' THEN 1
          WHEN status = 'Ongoing' THEN 2
          WHEN status = 'Completed' THEN 3
          ELSE 4
        END
    `);

    // Get urgency statistics - matching your actual urgency values
    const urgencyStats = await db.query(`
      SELECT 
        COALESCE(urgency, 'Low') as urgency, 
        COUNT(*) as count 
      FROM meresahar 
      GROUP BY urgency
      ORDER BY 
        CASE 
          WHEN urgency = 'High' THEN 1
          WHEN urgency = 'Medium' THEN 2
          WHEN urgency = 'Low' THEN 3
          ELSE 4
        END
    `);

    // Get trend data for last 7 days
    const trendStats = await db.query(`
      SELECT 
        DATE(created_at) as day,
        COUNT(*) as count
      FROM meresahar 
      WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY DATE(created_at)
      ORDER BY day ASC
      LIMIT 7
    `);

    // Get recent reports for table
    const recentReports = await db.query(`
      SELECT id, category, status, urgency, created_at
      FROM meresahar 
      ORDER BY created_at DESC 
      LIMIT 10
    `);

    // Calculate completion rate based on your actual status values
    const completedCount = statusStats.rows.find(s => s.status === 'Completed')?.count || 0;
    const completionRate = totalReports > 0 ? Math.round((completedCount / totalReports) * 100) : 0;

    // Map status counts for cards (using your actual status values)
    const pendingCount = statusStats.rows.find(s => s.status === 'pending')?.count || 0;
    const ongoingCount = statusStats.rows.find(s => s.status === 'Ongoing')?.count || 0;
    const completedCountCard = statusStats.rows.find(s => s.status === 'Completed')?.count || 0;

    res.render("report", {
      title: "Reports & Analytics Dashboard",
      totalReports,
      categoryStats: categoryStats.rows,
      statusStats: statusStats.rows,
      urgencyStats: urgencyStats.rows,
      trendStats: trendStats.rows,
      recentReports: recentReports.rows,
      completionRate,
      pendingCount,
      ongoingCount,
      completedCount: completedCountCard,
      admin: req.session.admin,
      error: null
    });

  } catch (err) {
    console.error("Error generating reports:", err);
    res.render("report", {
      title: "Reports & Analytics Dashboard",
      totalReports: 0,
      categoryStats: [],
      statusStats: [],
      urgencyStats: [],
      trendStats: [],
      recentReports: [],
      completionRate: 0,
      pendingCount: 0,
      ongoingCount: 0,
      completedCount: 0,
      admin: req.session.admin,
      error: "Unable to load reports data. Please try again later."
    });
  }
});


// -------------------- START SERVER --------------------
app.listen(port, () => console.log(`Server running at http://localhost:${port}`));
