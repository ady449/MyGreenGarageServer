const express = require("express");
const Joi = require("@hapi/joi");

const router = express.Router();

const {
  loginUser,
  registerUser,
  insertCar,
  getCars,
  getOneCar,
  deleteCar,
  updateInteriorTemperature,
} = require("./mongodb1");

// --------------User schema-----------

const User = Joi.object().keys({
  username: Joi.string(),
  password: Joi.string(),
});

// ----------------------------------------------------------------

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
});

//Post Method
router.post("/insertCar", (req, res) => {
  // We get the item from the request body
  const car = req.body;

  // The itemSchema is used to validate the fields of the item
  const result = carSchema.validate(car);
  if (result.error) {
    // if any of the fields are wrong, log the error and return a 400 status
    console.log(result.error);

    res.status(400).end();
    return;
  }

  // If the validation passes, insert the item into the DB
  insertCar(car)
    .then(() => {
      // Once the item is inserted successfully, return a 200 OK status
      res.json(car);
      res.status(200).end();
    })
    .catch((err) => {
      // If there is any error in inserting the item, log the error and
      // return a 500 server error status
      console.log(err);
      res.status(500).end();
    });
});

//Get all Method
router.get("/getAll", (req, res) => {
  getCars()
    .then((items) => {
      // The promise resolves with the items as results
      items = items.map((item) => ({
        // In mongoDB, each object has an id stored in the `_id` field
        // here a new field called `id` is created for each item which
        // maps to its mongo id
        id: item._id,
        brand: item.brand,
        model: item.model,
        dateofmanufacture: item.dateofmanufacture,
        batterylife: item.batterylife,
        batterylevel: item.batterylevel,
        insurance: item.insurance,
        temperature: item.temperature,
        range: item.range,
        vin: item.vin,
      }));

      // Finally, the items are written to the response as JSON
      res.json(items);
    })
    .catch((err) => {
      // If there is an error in getting the items, we return a 500 status
      // code, and log the error
      console.log(err);
      res.status(500).end();
    });
});

//Get by ID Method
router.get("/getOneCar/:id", (req, res) => {
  const { id } = req.params;
  getOneCar(id)
    .then((item) => {
      // If the update is successful, return a 200 OK status
      res.status(200);
      res.json(item).end();
    })
    .catch((err) => {
      // If the update fails, return a 500 server error
      console.log(err);
      res.status(500).end();
    });
});

//Update temperature by ID Method
router.put("/update/:id", (req, res) => {
  const { id } = req.params;

  const temperature = req.body.temperature;
  // The updateQuantity function is called with the id and quantity increment
  updateInteriorTemperature(id, temperature)
    .then(() => {
      // If the update is successful, return a 200 OK status
      res.json("temperature updated");
      res.status(200).end();
    })
    .catch((err) => {
      // If the update fails, return a 500 server error
      console.log(err);
      res.status(500).end();
    });
});

//Delete by ID Method
router.delete("/deleteCar/:id", (req, res) => {
  const { id } = req.params;

  deleteCar(id)
    .then((item) => {
      // If the update is successful, return a 200 OK status
      res.status(200);
      res.json(item).end();
    })
    .catch((err) => {
      // If the update fails, return a 500 server error
      console.log(err);
      res.status(500).end();
    });
});

router.get("/secret", isLoggedIn, function (req, res) {
  res.render("secret");
});

// method post for register
router.post("/register", async (req, res) => {
  const validate = User.validate(req.body);
  if (validate.error) {
    // if any of the fields are wrong, log the error and return a 400 status
    console.log(validate.error);

    res.status(400).end();
    return;
  }

  const user = await loginUser(req.body);

  if (user) {
    return res.status(400).json({ message: "User already exists" });
  }

  registerUser(req.body)
    .then(() => {
      res.json(req.body);
      res.status(200).end();
    })
    .catch((err) => {
      console.log(err);
      res.status(500).end();
    });
});

router.post("/login", async function (req, res) {
  try {
    // check if the user exists
    const validate = User.validate(req.body);
    if (validate.error) {
      // if any of the fields are wrong, log the error and return a 400 status
      console.log(validate.error);

      res.status(400).end();
      return;
    }

    const user = await loginUser(req.body);

    if (user) {
      //check if password matches
      const result = req.body.password === user.password;

      if (result) {
        res.status(200).json(result);
      } else {
        res.status(400).json({ error: "password doesn't match" });
      }
    } else {
      res.status(400).json({ error: "User doesn't exist" });
    }
  } catch (error) {
    res.status(400).json({ error });
  }
});

router.get("/logout", function (req, res) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.status(200);
}
module.exports = router;
