// app.js

// -----------------------------
// IMPORTS & CONFIGURATION
// -----------------------------
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { Pool } from "pg";
import multer from "multer";

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = 3000;

// -----------------------------
// POSTGRESQL CONNECTION SETUP
// -----------------------------
const db = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: { rejectUnauthorized: false }, // Adjust based on your DB setup
});

// Check DB connection at startup
db.connect()
  .then((client) => {
    console.log("Connected to PostgreSQL database.");
    client.release();
  })
  .catch((err) => {
    console.error("Error connecting to PostgreSQL", err);
    process.exit(1); // Stop the app if DB connection fails
  });

// -----------------------------
// FILE & DIRECTORY SETUP
// -----------------------------
// Fix __dirname with ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// -----------------------------
// MIDDLEWARE
// -----------------------------
app.use(express.static(path.join(__dirname, "public"))); // Serve static files
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded form data
// app.use(express.urlencoded({ extended: true, limit: "10mb" }));
// app.use(express.json({ limit: "10mb" }));

// Multer setup for handling file uploads (memory storage)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Set EJS as template engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// -----------------------------
// ROUTES
// -----------------------------

// Home route - serves the static index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "html", "index.html"));
});

// Dashboard route - display all user reports in EJS
app.get("/user", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM meresahar ORDER BY id DESC");

    // Convert BYTEA images to base64 for frontend display
    const issues = result.rows.map((row) => {
      let base64Before = null;
      let base64After = null;

      if (row.image) {
        const buffer = Buffer.isBuffer(row.image) ? row.image : Buffer.from(row.image);
        base64Before = `data:image/png;base64,${buffer.toString("base64")}`;
      }

      if (row.after_image) {
        const buffer = Buffer.isBuffer(row.after_image) ? row.after_image : Buffer.from(row.after_image);
        base64After = `data:image/png;base64,${buffer.toString("base64")}`;
      }

      return {
        id: row.id,
        username: row.username,
        category: row.category,
        description: row.description,
        latitude: row.latitude,
        longitude: row.longitude,
        status: row.status || "Pending",
        image: base64Before,
        after_image: base64After,
      };
    });

    res.render("user", { title: "MereSahar Dashboard", issues });
  } catch (err) {
    console.error("Error fetching records", err.stack);
    res.status(500).send("Database error");
  }
});

// Route to handle new reports submitted via form (with image upload)
app.post("/report", upload.single("image"), async (req, res) => {
  const { username, category, description, latitude, longitude } = req.body;

  console.log(
    `User's Data => Name: ${username}, Category: ${category}, Description: ${description}, Latitude: ${latitude}, Longitude: ${longitude}`
  );

  let imageBuffer = null;
  if (req.file) {
    imageBuffer = req.file.buffer; // Use buffer from multer directly
  }

  try {
    await db.query(
      `INSERT INTO meresahar (username, category, description, latitude, longitude, image)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [username, category, description, latitude, longitude, imageBuffer]
    );
    res.redirect("/user"); // Redirect to dashboard after submission
  } catch (err) {
    console.error("Error inserting record", err.stack);
    res.status(500).send("Database error");
  }
});

// Admin dashboard
app.get("/admin", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM meresahar ORDER BY id DESC");

    const issues = result.rows.map((row) => {
      let beforeImage = null;
      let afterImage = null;

      if (row.image) {
        const buffer = Buffer.isBuffer(row.image) ? row.image : Buffer.from(row.image);
        beforeImage = `data:image/png;base64,${buffer.toString("base64")}`;
      }

      if (row.after_image) {
        const buffer = Buffer.isBuffer(row.after_image) ? row.after_image : Buffer.from(row.after_image);
        afterImage = `data:image/png;base64,${buffer.toString("base64")}`;
      }

      return {
        id: row.id,
        username: row.username,
        category: row.category,
        description: row.description,
        latitude: row.latitude,
        longitude: row.longitude,
        status: row.status || "Pending",
        image: beforeImage,
        after_image: afterImage,
      };
    });

    res.render("admin", { issues });
  } catch (err) {
    console.error("Error fetching records", err.stack);
    res.status(500).send("Database error");
  }
});

// Update issue (status + after image)
app.post("/admin/update/:id", upload.single("after_image"), async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  let afterImageBuffer = null;
  if (req.file) {
    afterImageBuffer = req.file.buffer;
  }

  try {
    if (afterImageBuffer && status === "Completed") {
      await db.query(
        "UPDATE meresahar SET status = $1, after_image = $2 WHERE id = $3",
        [status, afterImageBuffer, id]
      );
    } else {
      await db.query("UPDATE meresahar SET status = $1 WHERE id = $2", [status, id]);
    }

    res.redirect("/admin");
  } catch (err) {
    console.error("Error updating record", err.stack);
    res.status(500).send("Database error");
  }
});

// -----------------------------
// START SERVER
// -----------------------------
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
