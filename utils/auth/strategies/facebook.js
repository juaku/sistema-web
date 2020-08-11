const passport = require("passport");
const { Strategy: FacebookStrategy } = require("passport-facebook");
const { config } = require("../../../config/index");

// Serialización de sesión
passport.serializeUser(function (user, done) {
  // saved to session
  // req.session.passport.user = {id: '..'
  done(null, user);
});

// Deserialización de sesión
passport.deserializeUser(function (obj, done) {
  // obj attaches to the request as req.user
  done(null, obj);
});

passport.use(
  new FacebookStrategy(
    {
      clientID: config.facebookClientId,
      clientSecret: config.facebookClientSecret,
      callbackURL: "https://juaku.com/auth/facebook/callback", //"/auth/facebook/callback",
      passReqToCallback: true,
      profileFields: [
        "id",
        "name",
        "displayName",
        "email",
        "location",
        "birthday",
      ],
    },
    function (req, accessToken, refreshToken, { _json: profile }, cb) {
      const user = {
        id: profile.id,
        displayName: profile.name,
        firstName: profile.first_name,
        lastName: profile.last_name,
        email: profile.email ? profile.email : `${profile.id}@facebook.com`,
        birthday: profile.birthday,
        location: profile.location.name,
      };
      if (!user) {
        return cb("Error", false); //cb(boom.unauthorized(), false);
      }
      return cb(null, user);
    }
  )
);
