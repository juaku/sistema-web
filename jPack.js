// Encriptador
var crip = require("./crip");

var FB = require("fb");

// Guardar imagen en el servidor
var fs = require("fs");

var http = require("http");

var url = require("url");

var CronJob = require("cron").CronJob;

//Para restingir el uso del @, signos de admiración, interrogación y caracteres especiales
//var validate = require("validate.js")

// Herramientas Geo - (Evaluar si es necesaria)
//var geolib = require('geolib');

//Modelos BD
var Tag = require("./models/tag");
var Action = require("./models/action");
var User = require("./models/user");

var jPack = jPack || {};

// Variable contador de publicaciones
var postCount = 0;
var postUpdate = 50;

jPack.showPosts = function (currenUserId, accessToken, post, next) {
  var posts = [];
  var savedPosts;
  countPosts = post.length;
  if (post.length == 0) {
    next(post);
  }
  User.findById(currenUserId, "savedPosts", function (err, user) {
    savedPosts = user.savedPosts;
    for (var i = 0; i < post.length; i++) {
      posts[i] = {};
      posts[i].id = post[i]._id;
      getUserInfo(post[i].authorId, i);
      if (post[i].authorId == currenUserId) {
        posts[i].edittable = true;
      } else {
        posts[i].edittable = false;
      }
      posts[i].editedTag = false;
      posts[i].tag = post[i].tag;
      posts[i].tag = post[i].tag;
      posts[i].time = post[i].createdAt;
      posts[i].media =
        "http://juaku-dev.cloudapp.net:5000/uploads/" + post[i].media; // '/uploads/' + post[i].media;
      posts[i].location = {};
      posts[i].location.latitude = post[i].geo[0];
      posts[i].location.longitude = post[i].geo[1];
      if (savedPosts.indexOf(posts[i].id) > -1) {
        posts[i].saved = true;
      } else {
        posts[i].saved = false;
      }
    }
  });
  function getUserInfo(id, i) {
    User.findById(
      id,
      "providerId hexCode simpleFirstName firstName simpleLastName lastName profilePic",
      function (err, user) {
        posts[i].fbId = user.providerId;
        posts[i].author = {};
        posts[i].author.id = post[i].authorId;
        posts[i].author.hexCode = user.hexCode;
        posts[i].author.firstName = user.firstName.replace(/ +/g, "");
        posts[i].author.lastName = user.lastName;
        posts[i].author.simpleFirstName = user.simpleFirstName;
        posts[i].author.simpleLastName = user.simpleLastName;
        posts[i].author.picture = user.profilePic;
        triggerNext();
      }
    );
  }
  function triggerNext() {
    countPosts--;
    if (countPosts === 0) {
      posts.sort(function (a, b) {
        var dateA = new Date(a.time),
          dateB = new Date(b.time);
        return dateB - dateA;
      });
      var response = { posts: posts };
      next(response);
    }
  }
};

jPack.validateName = function (pathname, next, error) {
  var pathRegExp = new RegExp(
    /^((?:[0-9A-Fa-f]{3})\.(?:[A-Za-záéíóúàèìòùäëïöüÿâêîôûçæœãõñÁÉÍÓÚÀÈÌÒÙÄËÏÖÜŸÂÊÎÔÛÇÆŒÃÕÑß%]{3,}))?(?:@([0-9A-Za-záéíóúàèìòùäëïöüÿâêîôûçæœãõñÁÉÍÓÚÀÈÌÒÙÄËÏÖÜŸÂÊÎÔÛÇÆŒÃÕÑß%]{3,}))?$|^([0-9A-Za-záéíóúàèìòùäëïöüÿâêîôûçæœãõñÁÉÍÓÚÀÈÌÒÙÄËÏÖÜŸÂÊÎÔÛÇÆŒÃÕÑß%]{3,})$/g
  );
  var path = pathRegExp.exec(pathname);
  var userId,
    hexCode,
    nameUser,
    tagName,
    channelRequest,
    userRequest,
    tagRequest,
    type;
  if (path[0]) {
    if (path[1]) {
      if (path[2]) {
        //Channel ejm:b3e.diego@aura
        userId = path[1].split(".");
        hexCode = userId[0];
        simplifyName(userId[1], function (nameuser) {
          nameuser = nameuser;
          simplifyName(path[2], function (tagName) {
            tagName = tagName;
            channelRequest = hexCode + "." + nameuser + "." + tagName;
            type = "channel";
            next(channelRequest, type);
          });
        });
      } else {
        //User ejm: b3e.diego
        userId = path[1].split(".");
        simplifyName(userId[0], function (hexCode) {
          hexCode = hexCode;
          simplifyName(userId[1], function (nameuser) {
            nameuser = nameuser;
            userRequest = hexCode + "." + nameuser;
            type = "user";
            next(userRequest, type);
          });
        });
      }
    } else {
      if (path[2]) {
        //Tag ejm: @aura
        simplifyName(path[2], function (tag) {
          tagName = tag;
          type = "tag";
          next(tagName, type);
        });
      } else if (path[3]) {
        //solo palabra ejm: aura
        simplifyName(path[3], function (tag) {
          tagName = tag;
          type = "tag";
          next(tagName, type);
        });
      }
    }
  } else {
    console.log("No permitido");
    error();
  }
};

jPack.checkTag = function (tag, next, error) {
  var pathRegExp = new RegExp(
    /(^[0-9A-Za-záéíóúàèìòùäëïöüÿâêîôûçæœãõñÁÉÍÓÚÀÈÌÒÙÄËÏÖÜŸÂÊÎÔÛÇÆŒÃÕÑß%]{3,})$/g
  );
  var tagName = pathRegExp.test(tag);
  if (tagName) {
    // false o true
    simplifyName(tag, function (tag) {
      next(tag);
    });
  } else {
    console.log("No permitido");
    error();
  }
};

function simplifyName(name, next) {
  var diacritics = [
    { re: /[\xC0-\xC6]/g, ch: "A" },
    { re: /[\xE0-\xE6]/g, ch: "a" },
    { re: /[\xC8-\xCB]/g, ch: "E" },
    { re: /[\xE8-\xEB]/g, ch: "e" },
    { re: /[\xCC-\xCF]/g, ch: "I" },
    { re: /[\xEC-\xEF]/g, ch: "i" },
    { re: /[\xD2-\xD6]/g, ch: "O" },
    { re: /[\xF2-\xF6]/g, ch: "o" },
    { re: /[\xD9-\xDC]/g, ch: "U" },
    { re: /[\xF9-\xFC]/g, ch: "u" },
    { re: /[\xD1]/g, ch: "N" },
    { re: /[\xF1]/g, ch: "n" },
    { re: /[\307]/g, ch: "C" },
    { re: /[\347]/g, ch: "c" },
  ];
  for (var i = 0; i < diacritics.length; i++) {
    name = name.replace(diacritics[i].re, diacritics[i].ch);
  }
  next(name.toLowerCase());
}

/*
 * @descrip Establece la información genérica del usuario.
 * @par {obj} data, {function} next, {function} error.
 * @return null
 */

jPack.setGenericData = function (req, next, error) {
  // TODO: Evaluar
  console.log("asignando ubición actual");
  req.session.coords = {};
  req.session.coords.latitude = req.body.latitude;
  req.session.coords.longitude = req.body.longitude;
  next();
};

/*
 * @descrip Cambia el idioma
 * @par {string} data, {object} data, {function} next, {function} error.
 * @return null
 */
jPack.changeLanguage = function (req, res, next, error) {
  var locale = req.body.language;
  if (locale != req.cookies.locale) {
    console.log("cambio de idioma exitoso");
    res.cookie("locale", locale, {
      maxAge: 1000 * 60 * 60 * 24 * 15,
      httpOnly: true,
    });
    next();
  }
  next();
};
/*
 * @descrip Función para revisar la carga de la aplicación
 */

// TODO: Evaluar
var job = new CronJob(
  "*/30 * * * * *",
  function () {
    //console.log(postCount);
  },
  function () {
    // This function is executed when the job stops
  },
  true /* Start the job right now */ /*,
	timeZone /* Time zone of this job. */
);

module.exports = jPack;
