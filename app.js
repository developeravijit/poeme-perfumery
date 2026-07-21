const path = require("path");
const dotenv = require("dotenv");
dotenv.config();

const envResult = dotenv.config({ path: path.resolve(__dirname, ".env") });
if (envResult.error) {
  throw envResult.error;
}
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
const pageAuth = require("./app/middleware/pageAuth/pageAuthMiddleware");
const cookieParser = require("cookie-parser");
const flash = require("connect-flash");
const http = require("http");
const socket = require("./app/socket/socket");
require("./app/config/passport");

const app = express();

// Database Connection
DbConnect();

// Json Config
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie Parser
app.use(cookieParser());

//Static Folder
app.use(express.static("public"));
app.use(express.static(path.join(__dirname, "public")));

// Ejs Define
app.set("view engine", "ejs");
app.set("views", "views");

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
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
app.use(pageAuth);

// Router Define
app.use(router);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).send("Internal Server Error");
});

const server = http.createServer(app);

socket(server);

const PORT = process.env.PORT || 4500;

server.listen(PORT, () => {
  console.log(`Port is running on ${PORT}`);
});
