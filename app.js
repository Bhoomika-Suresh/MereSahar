// app.js
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { Pool } from "pg";
import multer from "multer";

dotenv.config();

const app = express();
const port = 3000;

const db = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: { rejectUnauthorized: false },
});

db.connect()
  .then((client) => {
    console.log("Connected to PostgreSQL database.");
    client.release();
  })
  .catch((err) => {
    console.error("DB connection error", err);
    process.exit(1);
  });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
const storage = multer.memoryStorage();
const upload = multer({ storage });
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// --------------------
// ROUTES
// --------------------

// Home
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "html", "index.html"));
});

// Get all issues (frontend display only)
// Get all issues (frontend display with filters)
app.get("/user", async (req, res) => {
  const { category, status, urgency } = req.query;

  try {
    let query = `
      SELECT 
        id, username, category, description, latitude, longitude, status, urgency,
        (image IS NOT NULL) AS has_before,
        (after_image IS NOT NULL) AS has_after
      FROM meresahar
    `;

    let conditions = [];
    let values = [];
    let idx = 1;

    if (category) {
      conditions.push(`category = $${idx++}`);
      values.push(category);
    }
    if (status) {
      conditions.push(`status = $${idx++}`);
      values.push(status);
    }
    if (urgency) {
      conditions.push(`urgency = $${idx++}`);
      values.push(urgency);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY id DESC";

    const result = await db.query(query, values);

    const issues = result.rows.map((row) => ({
      ...row,
      status: row.status || "Pending",
      urgency: row.urgency || "Low",
    })); 

    res.render("user", { title: "MereSahar Dashboard", issues, req });
  } catch (err) {
    console.error("Error fetching records", err.stack);
    res.status(500).send("Database error");
  }
});



// Serve images separately
app.get("/images/:id/:type", async (req, res) => {
  const { id, type } = req.params; // type = "before" or "after"
  const column = type === "after" ? "after_image" : "image";

  try {
    const result = await db.query(`SELECT ${column} FROM meresahar WHERE id=$1`, [id]);
    if (!result.rows.length || !result.rows[0][column]) {
      return res.status(404).send("No image");
    }

    res.setHeader("Content-Type", "image/png");
    res.send(result.rows[0][column]);
  } catch (err) {
    console.error(err);
    res.status(500).send("DB error");
  }
});

// Submit new report
app.post("/report", upload.single("image"), async (req, res) => {
  const { username, category, description, latitude, longitude } = req.body;
  const imageBuffer = req.file ? req.file.buffer : null;

  // Ensure description is always a string
  const safeDescription = description.toString();

  try { 
    await db.query(
      `
      INSERT INTO meresahar (username, category, description, latitude, longitude, image)
      VALUES ($1,$2,$3,$4,$5,$6)
    `,
      [username, category, safeDescription, latitude, longitude, imageBuffer]
    );
    res.redirect("/user");
  } catch (err) {
    console.error(err.stack);
    res.status(500).send("Database error");
  }
});

// Admin dashboard
// Admin dashboard with filters
app.get("/admin", async (req, res) => {
  const { category, status, urgency } = req.query;

  try {
    let query = `
      SELECT 
        id, username, category, description, latitude, longitude, status, urgency,
        (image IS NOT NULL) AS has_before,
        (after_image IS NOT NULL) AS has_after
      FROM meresahar
    `;

    let conditions = [];
    let values = [];
    let idx = 1;

    if (category) {
      conditions.push(`category = $${idx++}`);
      values.push(category);
    }
    if (status) {
      conditions.push(`status = $${idx++}`);
      values.push(status);
    }
    if (urgency) {
      conditions.push(`urgency = $${idx++}`);
      values.push(urgency);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY id DESC";

    const result = await db.query(query, values);

    const issues = result.rows.map((row) => ({
      ...row,
      status: row.status || "Pending",
      urgency: row.urgency || "Low",
    }));

    res.render("admin", { issues });
  } catch (err) {
    console.error("Error fetching records", err.stack);
    res.status(500).send("Database error");
  }
});


// Update issue
app.post("/admin/update/:id", upload.single("after_image"), async (req, res) => {
  const { id } = req.params;
  const { status, urgency } = req.body; // added urgency
  const afterImageBuffer = req.file ? req.file.buffer : null;

  try {
    if (afterImageBuffer && status === "Completed") {
      await db.query(
        "UPDATE meresahar SET status=$1, urgency=$2, after_image=$3 WHERE id=$4",
        [status, urgency, afterImageBuffer, id]
      );
    } else {
      await db.query(
        "UPDATE meresahar SET status=$1, urgency=$2 WHERE id=$3",
        [status, urgency, id]
      );
    }
    res.redirect("/admin");
  } catch (err) {
    console.error(err.stack);
    res.status(500).send("DB error");
  }
});


app.listen(port, () => console.log(`Server running at http://localhost:${port}`));
