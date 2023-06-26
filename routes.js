const express = require("express");
const router = express.Router();
const crypto = require("crypto");

const {
  updateIsLocked,
  loginUser,
  registerUser,
  insertCar,
  getCars,
  getOneCar,
  deleteCar,
  addCarFull,
  updateInteriorTemperature,
} = require("./mongodb1");

router.post("/insertCarFull", (req, res) => {
  addCarFull(req.body.car, req.body.user.username)
    .then(() => {
      // Once the item is inserted successfully, return a 200 OK status
      res.json(addCarFull);
      res.status(200).end();
    })
    .catch((err) => {
      // If there is any error in inserting the item, log the error and
      // return a 500 server error status
      console.error(err);
      res.status(500).end();
    });
});

//Get all Method
router.get("/getAll", async (req, res) => {
  const username = req.body.username;
  getCars(username)
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
        isLocked: item.isLocked,
        km: item.km,
        camera: item.camera,
        geolocation: item.geolocation,
      }));

      // Finally, the items are written to the response as JSON
      res.json(items);
    })
    .catch((err) => {
      // If there is an error in getting the items, we return a 500 status
      // code, and log the error
      console.error(err);
      res.status(500).end();
    });
});

router.get("/getAllNames", (req, res) => {
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
  const isLocked = req.body.isLocked;
  // The updateQuantity function is called with the id and quantity increment
  updateInteriorTemperature(id, temperature);
  updateIsLocked(id, isLocked)
    .then(() => {
      // If the update is successful, return a 200 OK status
      res.json("car updated");
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
  const user = await loginUser(req.body);

  if (user) {
    return res.status(400).json({ message: "User already exists" });
  } else if (user == 3) {
    return res.status(400).json({ message: "user validation error" });
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

    const user = await loginUser(req.body);
    if (user) {
      //check if password matches
      const result = req.body.password === user.password;

      if (result) {
        res.status(200).json(result);
      } else {
        res.status(400).json({ error: "password doesn't match" });
      }
    } else if (user == 3) {
      res.status(400).json({ error: "validate user error" }).end();
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
