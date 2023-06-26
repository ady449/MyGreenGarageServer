require("dotenv").config();

const port = process.env.PORT || 3000;
const dbHost = process.env.DB_HOST;
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
const apiKey = process.env.API_KEY;
const express = require("express");
const bodyParser = require("body-parser");
const { init } = require("./mongodb1");
const routes = require("./routes");
const cors = require("cors");
const morgan = require("morgan");
const crypto = require("crypto");
const fs = require("fs");
const dotenv = require("dotenv");

// Create a new express app
const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(routes);
app.use(morgan("combined"));

init().then(() => {
  console.log(`starting server on port ${port}`);
  app.listen(port, "0.0.0.0");
});
