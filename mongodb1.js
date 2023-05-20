require("dotenv").config();

const dbHost = process.env.DB_HOST;
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;

// Rest of your server code

const express = require("express");

const username = encodeURIComponent(dbUser);
const password = encodeURIComponent(dbPassword);

const app = express();
const validator = require("validator");

function validateInteger(value) {
  return validator.isInt(String(value));
}

// db.js

// import the `MongoClient` object from the library
const { MongoClient, ObjectId } = require("mongodb");
// var ObjectId = require("mongodb").ObjectID;

// define the connection string. If you're running your DB
// on your laptop, this would most likely be it's address
const connectionUrl = `mongodb+srv://${username}:${password}@cluster0.5icgwin.mongodb.net/?retryWrites=true&w=majority`;

// Define the DB name. We will call ours `store`
const dbName = "MyGreenGarage";

// Create a singleton variable `db`
let db;

// The init function retruns a promise, which, once resolved,
// assigns the mongodb connection to the `db` variable
const init = () =>
  MongoClient.connect(connectionUrl, { useNewUrlParser: true }).then(
    (client) => {
      db = client.db(dbName);
    }
  );

// db.js

// Take the item as an argument and insert it into the "items" collection
const insertCar = (item) => {
  const collection = db.collection("Car");
  return collection.insertOne(item);
};

// get all items from the "items" collection
const getCars = () => {
  const collection = db.collection("Car");
  return collection.find({}).toArray();
};
const getOneCar = (id) => {
  const collection = db.collection("Car");
  return collection.find({ _id: new ObjectId(id) }).toArray();
};
const deleteCar = (id) => {
  const collection = db.collection("Car");
  return collection.deleteOne({ _id: new ObjectId(id) });
};
const updateInteriorTemperature = (id, quantity) => {
  const collection = db.collection("Car");
  //   console.log("id is " + id + " quantity is " + quantity);
  if (validateInteger(quantity)) {
    return collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { temperature: quantity } }
    );
  }

  return Promise.reject(new Error("Invalid quantity provided."));
};
const loginUser = (user) => {
  const collection = db.collection("User");
  return collection.findOne({ username: user.username });
};
const registerUser = (user) => {
  const collection = db.collection("User");
  return collection.insertOne(user);
};
// export the required functions so that we can use them elsewhere
module.exports = {
  loginUser,
  registerUser,
  init,
  insertCar,
  getCars,
  getOneCar,
  deleteCar,
  updateInteriorTemperature,
};
