import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { Pool } from "pg";

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = 3000;

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

let issues;

// Routes
app.get("/", async (req, res) => {
  // to retrive Data
  try {
    const query = `SELECT * FROM meresahar`;
    const result = await db.query(query);
    //res.json(result.rows); // send all rows as JSON
    res.render("index", {
    title: "My EJS App",
    issues: result.rows,
  });
  } catch (err) {
    console.error("Error fetching records", err.stack);
    res.status(500).send("Database error");
  }
});

//location recever router
app.post("/report", async (req, res) => {
  const { username, category, description, latitude, longitude } = req.body;
  console.log("User's Location:", latitude, longitude);

  console.log(
    `User's Data => Name: ${username},category: ${category},description: ${description}, Latitude: ${latitude}, Longitude: ${longitude}`
  );
  //to insert data
  try {
    const query = `
      INSERT INTO meresahar (username, category, description, latitude, longitude)
      VALUES ($1, $2, $3, $4, $5)
    `;
    await db.query(query, [
      username,
      category,
      description,
      latitude,
      longitude,
    ]);
    res.send("Record added successfully!");
  } catch (err) {
    console.error("Error inserting record", err.stack);
    res.status(500).send("Database error");
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
