const path = require("path");
const dotenv = require("dotenv");

dotenv.config();

// ENV Define
const requiredEnv = [
  "SESSION_SECRET",
  "JWT_SECRET",
  "JWT_REFRESH_SECRET",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GOOGLE_CALLBACK_URL",
];

requiredEnv.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
});

const express = require("express");
const DbConnect = require("./app/config/db");
const router = require("./app/routes");
const session = require("express-session");
const passport = require("passport");
const cookieParser = require("cookie-parser");
const flash = require("connect-flash");
const http = require("http");
const socket = require("./app/socket/socket");
const admin = require("./app/utils/admin");

require("./app/config/passport");
require("./app/cron/deleteUser");

const app = express();

const PORT = process.env.PORT || 4500;

// Body Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie Parser
app.use(cookieParser());

// Static Folder
app.use(express.static("public"));
app.use(express.static(path.join(__dirname, "public")));

// View Engine
app.set("view engine", "ejs");
app.set("views", "views");

// Session
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 10 * 60 * 1000,
    },
  })
);

// Flash
app.use(flash());

// Passport
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use(router);

// Error Handler
app.use((err, req, res, next) => {
  console.error("Error:", err);

  res.status(err.status || 500).send("Internal Server Error");
});

// Start Application
const startServer = async () => {
  try {
    // 1. Connect MongoDB
    await DbConnect();

    // 2. Create/check admin
    await admin();

    // 3. Create HTTP server
    const server = http.createServer(app);

    // 4. Initialize Socket.IO
    socket(server);

    // 5. Start server
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error);
    process.exit(1);
  }
};

startServer();
