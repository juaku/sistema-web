const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");
var config = require("../config");
var mongoose = require("mongoose");

// const { config } = require("../config");

// //Serialización de sesión
// passport.serializeUser(function (user, done) {
//   console.log("SERIALIZE USER!");
//   console.log(user);
//   done(null, user);
// });

// passport.deserializeUser(function (obj, done) {
//   console.log("deserializando user!! lalalal ph yeah!!!");
//   console.log(obj);
//   done(null, obj);
// });

// Facebook strategy
// require("../utils/auth/strategies/facebook");

function authApi(app) {
  const router = express.Router();
  app.use("/auth", router);

  router.get(
    "/facebook",
    passport.authenticate("facebook", {
      scope: ["email", "user_location", "user_birthday"],
      failureRedirect: "/login",
      display: "popup",
    })
  );

  router.get(
    "/facebook/callback",
    passport.authenticate("facebook", { session: false }),
    function (req, res, next) {
      if (!req.user) {
        next("error"); // next(boom.unauthorized());
      }

      req.session.token = jwt.sign({ id: req.user.id }, config.tokenSecret, {
        expiresIn: 60 * 60 * 24 * 15 /* 15 Días */,
      });
      // Loguear al usuario
      var User = mongoose.model("User");
      User.signUp(
        req,
        function () {
          res.render("access");
        },
        function (error) {
          console.log("error");
        }
      );
      // res.redirect("/");
    }
  );
}

module.exports = authApi;
