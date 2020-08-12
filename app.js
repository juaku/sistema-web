// Import modules
var express = require("express");
var config = require("./config");
var session = require("express-session");
var path = require("path");
var favicon = require("static-favicon");
var morgan = require("morgan");
var cookieParser = require("cookie-parser");
var bodyParser = require("body-parser");
var passport = require("passport");

// json web token
var jwt = require("jsonwebtoken");
var config = require("./config");
var mongoose = require("mongoose");

// Stylus y Nib
var stylus = require("stylus");
var nib = require("nib");

// Conexión con MongoDB
var db = require("./mongodbConnect");

//Sesion permanente
var redisStore = require("connect-redis")(session);
var utils = require("./utils");

//i18n
var i18n = require("i18n");

i18n.configure({
  locales: ["en", "es"],
  cookie: "locale",
  directory: __dirname + "/locales",
});

var access = require("./routes/access");
var login = require("./routes/login");
var logout = require("./routes/logout");
var post = require("./routes/post");
var user = require("./routes/user");
var list = require("./routes/list");
var routes = require("./routes/index");

// geo block
var ipgeoblock = require("node-ipgeoblock");

var app = express();

// Import routes
const postsApi = require("./routes/posts");
const usersApi = require("./routes/users");
postsApi(app);
usersApi(app);

// Inicializar Stylus + Nib
function compile(str, path) {
  return stylus(str)
    .set("filename", path)
    .set("compress", false) // .css final comprimido en una linea
    .use(nib())
    .import("nib"); // Nuevo en documentación
}

app.use(stylus.middleware({ src: __dirname + "/public", compile: compile }));

// ver configuración de motor
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

app.use(favicon());
app.use(morgan("dev"));
app.use(bodyParser.json({ limit: "1mb" }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(
  session({
    secret: "R4y6G5j7D3c3R4273092",
    store: new redisStore({
      host: "localhost",
      port: "6379",
    }),
    cookie: { path: "/", maxAge: 1000 * 60 * 60 * 24 * 15 }, // 15 Días
    resave: false,
    saveUninitialized: false,
  })
);

//NO CACHE
/*app.use(function(req, res, next) {
  req.headers['if-none-match'] = 'no-match-for-this';
  next();
});*/

// Usar Multer - Ya no se require
//app.use(multer({ dest: './public/uploads/'}));

app.use(passport.initialize()); // Inicializa Passport
app.use(passport.session()); // Sesiones de inicio de sesión persistentes (recomendado).
// Facebook strategy
require("./utils/auth/strategies/facebook");

app.use(express.static(path.join(__dirname, "public")));

// geo block
app.use(
  ipgeoblock(
    {
      geolite2: "./GeoLite2-Country.mmdb",
      allowedCountries: ["PE"],
    },
    function (req, res) {
      res.status(403).end();
      //res.statusCode = 500;
      //res.end("Internal Server Error");
    }
  )
);

//Inicializar i18n
app.use(i18n.init);

//Título de aplicación
app.locals.title = "Juaku";

//DEV: Restringir el uso a usuarios que no sean clientes del servidor
if (app.get("env") === "development") {
  app.use(function (req, res, next) {
    var IPv4 = req.ip.split(":")[3];
    // TODO: true en if
    console.log("IPv4!!!!!");
    console.log(IPv4);
    if (
      true ||
      IPv4 == process.env.SSH_CLIENT.split(" ")[0] ||
      IPv4.includes("179.7.") ||
      IPv4.includes("190.113.")
    ) {
      // IP cliente SSH e ip's de Claro
      next();
    } else {
      console.log("Acceso denegado para: " + req.ip);
      res.status(403).end();
    }
  });
}

//Usar rutas
app.use("/access", access);
app.use("/login", login);
app.use("/logout", logout);
app.use("/post", post);
app.use("/user", user);
app.use("/list", list);
app.use("/", routes);

// Autenticación con Facebook
// GET /auth/facebook
app.get(
  "/auth/facebook",
  passport.authenticate("facebook", {
    scope: ["email", "user_location", "user_birthday"],
    failureRedirect: "/login",
    display: "popup",
  })
);

// GET /auth/facebook/callback
app.get(
  "/auth/facebook/callback",
  passport.authenticate("facebook", { failureRedirect: "/login" }),
  function (req, res) {
    // Successful authentication, redirect home.
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
  }
);

/// captura un 404 y reenvia un error al manejador
app.use(function (req, res, next) {
  var err = new Error("Not Found");
  err.status = 404;
  next(err);
});

/// controladores de errores

// controlador de errores de desarrollo
// imprimirá stacktrace
if (app.get("env") === "development") {
  app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render("error", {
      message: err.message,
      error: err,
    });
  });
}

// controlador de errores de producción
// ningún stacktraces filtró al usuario
app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  res.render("error", {
    message: err.message,
    error: {},
  });
});

module.exports = app;
