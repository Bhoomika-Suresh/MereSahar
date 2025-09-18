import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const port = 3000;

// Fix __dirname with ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set EJS as the template engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Serve static files (CSS, images, JS)
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));

// Routes
app.get("/", (req, res) => {
  res.render("index", {
    title: "My EJS App",
    message: "Welcome to EJS Starter!",
  });
});

//location recever router
app.post("/location", (req, res) => {
  const { username, latitude, longitude } = req.body;
  console.log("User's Location:", latitude, longitude);

  console.log(
    `User's Data => Name: ${username}, Latitude: ${latitude}, Longitude: ${longitude}`
  );

  res.send(
    `Location received from ${username}: Latitude = ${latitude}, Longitude = ${longitude}`
  );
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
