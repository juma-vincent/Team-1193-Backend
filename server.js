const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt-nodejs");
const cors = require("cors");
const knex = require("knex");
if (process.env.NODE_ENV !== "production") require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const db = knex({
  client: "pg",
  connection: {
    host: "127.0.0.1",
    user: "postgres",
    password: "2416Vince",
    database: "IntelligentFarm",
  },
});

const app = express();

app.use(bodyParser.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("This is the intelligent farm BuildForSDG project server.");
});

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

app.get("/farmproduce", (req, res) => {
  db.select("*")
    .from("farmproduce")
    .then((data) => res.json(data))
    .catch((error) => res.status(400).json("unable to get the data"));
});

app.post("/register", (req, res) => {
  const { name, email, password } = req.body;
  const hash = bcrypt.hashSync(password);
  db.transaction((trx) => {
    trx
      .insert({
        hash: hash,
        email: email,
      })
      .into("login")
      .returning("email")
      .then((loginEmail) => {
        return trx("users")
          .returning("*")
          .insert({ name: name, email: loginEmail[0], joined: new Date() })
          .then((user) => res.json(user[0]));
      })
      .then(trx.commit)
      .catch(trx.rollback);
  }).catch((error) => res.status(400).json("unable to register"));
});

app.post("/signin", (req, res) => {
  const { email, password } = req.body;
  db.select("email", "hash")
    .from("login")
    .where("email", "=", email)
    .then((data) => {
      const isValid = bcrypt.compareSync(password, data[0].hash);
      if (isValid) {
        return db
          .select("*")
          .from("users")
          .where("email", "=", email)
          .then((user) => {
            res.json(user[0]);
          })
          .catch((error) => res.status(400).json("unable to get user"));
      } else {
        res.status(400).json("Incorrect credentials");
      }
    })
    .catch((error) => res.status(400).json("wrong credentials"));
});

// app.post("/payment", (req, res) => {
//   const body = {
//     source: req.body.token.id,
//     amount: req.body.amount,
//     currency: "usd",
//   };
//   stripe.charges.create(body, (stripeErr, stripeRes) => {
//     if (stripeErr) {
//       res.status(500).send({ error: stripeErr });
//     } else {
//       res.status(200).send({ success: stripeRes });
//     }
//   });
// });

app.get("/payment", (req, res) => {
  res.send("payment is working");
});

app.listen(process.env.PORT || 5000, () => {
  console.log(`App is running on port ${process.env.PORT}`);
});
