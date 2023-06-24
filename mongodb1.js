require("dotenv").config();

const dbHost = process.env.DB_HOST;
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
const public_key = process.env.PUBLIC_KEY;
const private_key = process.env.PRIVATE_KEY;

// Rest of your server code

const express = require("express");

const username = encodeURIComponent(dbUser);
const password = encodeURIComponent(dbPassword);

const app = express();
const validator = require("validator");

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
const getCars = async (id) => {
  const garagesCollection = db.collection("Garaj");
  const userCol = db.collection("User");
  const carsCollection = db.collection("Car");
  try {
    const userGarage = await userCol.findOne({ username: id });
    if (!userGarage) {
      return res.status(404).json({ message: "User not found" });
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
    res.sendStatus(500);
  }
};
//cand creez cont sa creeze loc si pentru garaj
const addCarFull = (item, username) => {
  const carsCollection = db.collection("Car");
  const garajCollection = db.collection("Garaj");
  const usersCollection = db.collection("Users");
  const insertResult = await carsCollection.insertOne(item);
  const insertedCarId = insertResult.insertedId;
  console.log("insert id is ", insertedCarId);

  const userGarage = await garajCollection.findOne({ username: username });
  console.log("userGarage",userGarage);
  return  await garajCollection.updateOne(
    { _id:  new ObjectId(userGarage.garage) },
    { $push: { 'Cars': insertedCarId} }
  );

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
const loginUser = (user) => {
  const collection = db.collection("User");
  var user = collection.findOne({ username: user.username })
  const decryptedData = crypto.privateDecrypt(
    {
      key: private_key,
      // In order to decrypt the data, we need to specify the
      // same hashing function and padding scheme that we used to
      // encrypt the data in the previous step
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256",
    },
    user.password,
  );
  
  user.password = decryptedData;

  // The decrypted data is of the Buffer type, which we can convert to a
  // string to reveal the original data
  console.log("decrypted data: ", decryptedData.toString());
  
  return user;
};
const registerUser = (user) => {
    const collection = db.collection("User");
  
// This is the data we want to encrypt
    const data = user.password;

    const encryptedData = crypto.publicEncrypt(
    {
        key: public_key,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: "sha256",
    },
    // We convert the data string to a buffer using `Buffer.from`
        Buffer.from(data)
    );
    
    user.password = encryptedData.toString("base64");
    // The encrypted data is in the form of bytes, so we print it in base64 format
    // so that it's displayed in a more readable form
    console.log("encypted data: ", encryptedData.toString("base64"));

  return collection.insertOne(user);
  
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
  addCarFullName,
  updateInteriorTemperature,
};
