require("dotenv").config();

const dbHost = process.env.DB_HOST;
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
const bcrypt = require("bcrypt");
const express = require("express");
const username = encodeURIComponent(dbUser);
const password = encodeURIComponent(dbPassword);
const app = express();
const validator = require("validator");
const Joi = require("@hapi/joi");
Joi.objectId = require("joi-objectid")(Joi);
function validateInteger(value) {
  return validator.isInt(String(value));
}

function validateBoolean(value) {
  return validator.isBoolean(String(value));
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
// const getCars = () =>{
//     const collection = db.collection("Car");
//     return collection.find({}).toArray();

// }
// --------------Garage schema-----------
const garageSchema = Joi.object({
  _id: Joi.objectId(),
  Cars: Joi.array(),
});
// --------------User schema-----------

const User = Joi.object().keys({
  name: Joi.string(),
  username: Joi.string(),
  password: Joi.string(),
  email: Joi.string(),
});

// -----------------------------Car schema-----------------------------------
const carSchema = Joi.object().keys({
  brand: Joi.string(),
  model: Joi.string(),
  dateofmanufacture: Joi.string(),
  batterylife: Joi.number().integer().min(0).max(100),
  batterylevel: Joi.number().integer().min(0).max(100),
  insurance: Joi.string(),
  range: Joi.number().integer().min(0),
  vin: Joi.string(),
  temperature: Joi.number().integer(),
  isLocked: Joi.boolean(),
  camera: Joi.boolean(),
  km: Joi.number().integer(),
  geolocation: Joi.object().keys({
    latitude: Joi.number(),
    longitude: Joi.number(),
  }),
});
const getCars = async (un) => {
  const garagesCollection = db.collection("Garaj");
  const userCol = db.collection("User");
  const carsCollection = db.collection("Car");
  try {
    const userGarage = await userCol.findOne({ username: un });
    if (!userGarage) {
      return "User not found";
    }
    const garages = await garagesCollection
      .find({ _id: new ObjectId(userGarage.garage) })
      .toArray((err, garages) => {
        if (err) {
          console.error("Error fetching garages: ", err);
          res.sendStatus(500);
          return;
        }

        res.json(garages);
      });
    const cars = await carsCollection.find({ _id: { $in: garages[0].Cars } });

    return cars.toArray();
  } catch (err) {
    console.error("Error fetching garages: ", err);
    return err;
  }
};

async function verifyPassword(password, hashedPassword) {
  try {
    if (
      password != null &&
      hashedPassword != null &&
      password != undefined &&
      hashedPassword != undefined
    ) {
      const isMatch = await bcrypt.compare(password, hashedPassword);
      return isMatch;
    } else {
      return null;
    }
  } catch (error) {
    console.error(error);
  }
}
// Function to hash and verify the password
async function hashPassword(password) {
  try {
    // Generate a unique salt for the user
    const salt = await bcrypt.genSalt(10);
    // Hash the password with the salt
    return await bcrypt.hash(password, salt);
  } catch (error) {
    console.error("Hash password error: ", error);
  }
}
const addCarInGarage = async (insertedCarId, user) => {
  const garajCollection = db.collection("Garaj");
  try {
    //verifica daca exista user in garaj
    const userGarage = await garajCollection.findOne({ _id: user.garage });
    // verifica daca exista deja o masian introdusa in garaj
    let checkCarInGarage;
    if (userGarage) {
      checkCarInGarage = userGarage.Cars.some((item) =>
        item.equals(insertedCarId)
      );
    } else {
      console.error(
        "Garage not found for user: ",
        user.username,
        "with id " + user._id
      );
      return;
    }
    if (checkCarInGarage) {
      console.log("Object exists in the garage");
      return;
      // daca nu exista vehicul in garaj, il adauga in garaj.
    } else {
      console.log("Object does not exist in the garage");
      const result = await garajCollection.updateOne(
        { _id: user.garage },
        { $push: { Cars: insertedCarId } }
      );
      if (!!result) {
        console.log("Car added successfully.");
      }
    }
  } catch (err) {
    console.error("Error updating document:", err);
  }
};
//se creaza graj la crearea utilizatorului
const addCarFull = async (item, un) => {
  const result = carSchema.validate(item);

  if (result.error) {
    // if any of the fields are wrong, log the error and return a 400 status
    console.log(result.error);

    res.status(400).end();
    return;
  }

  const carsCollection = db.collection("Car");
  const usersCollection = db.collection("User");
  const checkUserExist = await usersCollection.findOne({ username: un });
  if (checkUserExist === undefined || checkUserExist === null) {
    console.error("User " + un + " cannot be found.");
    return;
  }
  //verific daca se poate adauga vehicul
  const checkCarInCarCollection = await carsCollection.findOne({
    vin: item.vin,
  });

  if (checkCarInCarCollection && checkUserExist) {
    console.error("Car already exists");
    const result = await addCarInGarage(
      checkCarInCarCollection._id,
      checkUserExist
    );
    return result;
  } else if (checkUserExist != null && checkUserExist != undefined) {
    // insereaza vehicul
    const insertResult = await carsCollection.insertOne(item);
    // ObjectId al obiectului inserat mai sus
    insertedCarId = insertResult.insertedId;
    console.log("The car has been added successfully!");
    const result = await addCarInGarage(insertedCarId, checkUserExist);
    return result;
  }
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
const updateIsLocked = (id, quantity) => {
  const collection = db.collection("Car");
  //   console.log("id is " + id + " quantity is " + quantity);
  if (validateBoolean(quantity)) {
    return collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { isLocked: quantity } }
    );
  }

  return Promise.reject(new Error("Invalid quantity provided."));
};
const loginUser = async (user1) => {
  const collection = db.collection("User");
  const validate = User.validate(user1);
  if (validate.error) {
    // if any of the fields are wrong, log the error and return a 400 status
    console.log(validate.error);
    return 3;
  }

  var user = await collection.findOne({ username: user1.username });

  if (user && user1 && verifyPassword(user1.password, user.password)) {
    return user1;
  } else {
    return null;
  }
};
const registerUser = async (user) => {
  const collection = db.collection("User");
  const garageCollection = db.collection("Garaj");
  const hash = await hashPassword(user.password);
  user.password = hash;
  let garage = { _id: new ObjectId(), Cars: new Array() };

  //   const validationResult = garageSchema.validate(garage);
  const validationResult = true;
  if (validationResult.error) {
    // Validation failed
    console.error("validation garage error: " + validationResult.error);
  } else {
    // Validation successfulconsole.log("Data is valid");
    garageCollection.insertOne(garage);
    user.garage = garage._id;
    return collection.insertOne(user);
  }
};

// export the required functions so that we can use them elsewhere
module.exports = {
  updateIsLocked,
  loginUser,
  registerUser,
  init,
  insertCar,
  getCars,
  getOneCar,
  deleteCar,
  addCarFull,
  updateInteriorTemperature,
};
