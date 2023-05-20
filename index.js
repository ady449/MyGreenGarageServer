require("dotenv").config();

const port = process.env.PORT || 3000;
const dbHost = process.env.DB_HOST;
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
const apiKey = process.env.API_KEY;

// Rest of your server code
const express = require("express");
// The `body-parser` library helps us parse the HTTP request body and provide
// it to our routes as a javascript object
const bodyParser = require("body-parser");
// The init function is imported from our `db.js` file, as well as the routes
// we created in `routes.js`
const { init } = require("./mongodb1");
const routes = require("./routes");
const cors = require("cors");
// Create a new express app
const app = express();
// Add the body parses middleware, as well as the HTTP routes
app.use(cors());
app.use(bodyParser.json());
app.use(routes);

// Initialize the database
init().then(() => {
  // Once the database is initialized, start the server by listening
  // on port 3000
  console.log(`starting server on port ${port}`);
  app.listen(port, "0.0.0.0");
});
