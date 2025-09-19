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

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// PostgreSQL connection setup using environment variables
const db = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Fix __dirname with ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check DB connection at startup
db.connect()
  .then((client) => {
    console.log("Connected to PostgreSQL database.");
    client.release(); // release the client back to the pool
  })
  .catch((err) => {
    console.error("Error connecting to PostgreSQL", err);
    process.exit(1); // stop the app if DB connection fails
  });

// Set EJS as the template engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Serve static files (CSS, images, JS)
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
//app.use(express.urlencoded({ extended: true, limit: "10mb" }));
//app.use(express.json({ limit: "10mb" }));

let issues;

// Routes
app.get("/", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM meresahar ORDER BY id DESC");

    // Convert BYTEA images to base64 for frontend
    const issues = result.rows.map((row) => {
      let base64Image = null;
      if (row.image) {
        const buffer = Buffer.isBuffer(row.image) ? row.image : Buffer.from(row.image);
        base64Image = `data:image/png;base64,${buffer.toString("base64")}`;
      }
      return {
        id: row.id,
        username: row.username,
        category: row.category,
        description: row.description,
        latitude: row.latitude,
        longitude: row.longitude,
        status: row.status || "Pending",
        image: base64Image,
      };
    });

    res.render("index", { title: "MereSahar Dashboard", issues });
  } catch (err) {
    console.error("Error fetching records", err.stack);
    res.status(500).send("Database error");
  }
});


//location recever router
app.post("/report", upload.single("image"), async (req, res) => {
  const { username, category, description, latitude, longitude } = req.body;

  console.log(
    `User's Data => Name: ${username}, category: ${category}, description: ${description}, Latitude: ${latitude}, Longitude: ${longitude}`
  );

  let imageBuffer = null;

  if (req.file) {
    imageBuffer = req.file.buffer; // ✅ use the buffer from multer directly
  }

  try {
    await db.query(
      `INSERT INTO meresahar (username, category, description, latitude, longitude, image)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [username, category, description, latitude, longitude, imageBuffer]
    );
    //res.send("Record added successfully!");
    res.redirect("/");
  } catch (err) {
    console.error("Error inserting record", err.stack);
    res.status(500).send("Database error");
  }
});


app.get("/show", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM meresahar ORDER BY id DESC");

    // Convert BYTEA image to base64 for each report
    const reports = result.rows.map((row) => {
      let base64Image = null;

      if (row.image) {
        // Check if row.image is a Buffer
        const buffer = Buffer.isBuffer(row.image) ? row.image : Buffer.from(row.image);
        base64Image = `data:image/png;base64,${buffer.toString("base64")}`;
      }

      return {
        id: row.id,
        username: row.username,
        category: row.category,
        description: row.description,
        latitude: row.latitude,
        longitude: row.longitude,
        image: base64Image,
      };
    });

    res.render("reports", { reports });
  } catch (err) {
    console.error("Error fetching reports:", err);
    res.status(500).send("Error fetching reports");
  }
});



// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
