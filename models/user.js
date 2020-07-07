var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var FB = require("fb");
var fs = require("fs");
var http = require("http");
var https = require("https");
var url = require("url");
require("./tag");
require("./action");

var UserSchema = new Schema({
  providerId: { type: String, unique: true },
  provider: String,
  simpleFirstName: String,
  simpleLastName: String,
  firstName: String,
  lastName: String,
  gender: String,
  birthDate: Date,
  location: String,
  hexCode: String,
  posts: [{ type: Schema.Types.ObjectId, ref: "Post" }],
  savedPosts: [{ type: Schema.Types.ObjectId, ref: "Post" }],
  reportedPosts: [{ type: Schema.Types.ObjectId, ref: "Post" }],
  channels: [{ type: Schema.Types.ObjectId, ref: "User" }],
  blockedUsers: [{ type: Schema.Types.ObjectId, ref: "User" }],
  createdAt: { type: Date, default: Date.now },
  profilePic: String,
});

UserSchema.index({ hexCode: 1, simpleFirstName: 1 }, { unique: true }); // de esta manera se declara una clave compuesta en mongodb
/*
 * @descrip Busca el id de fb del usuario que ingresa, si está registrado sus datos serán retornado y sino registrará un usuario nuevo retornando sus datos
 * @par {object} req, {function} callback, {function} error.
 * @return null
 */
UserSchema.statics.signUp = function (req, callback, error) {
  this.findOne({ providerId: req.user.id }, function (err, user) {
    var currentUser = user;
    if (err) throw err;
    var letters = "0123456789abcdef".split("");
    var color = "";
    for (var i = 0; i < 3; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    FB.api(
      "/" + req.user.id + "/picture",
      "GET",
      { redirect: "false", height: 200 },
      function (response) {
        /*
      response data sample
      { data:
        { height: 200,
          is_silhouette: false,
          url: 'https://scontent.xx.fbcdn.net/v/t1.0-1/p200x200/12647373_10208631356966931_4483358289258923957_n.jpg?_nc_cat=108&_nc_ht=scontent.xx&oh=381e6855e61fe768859591346761b873&oe=5D662DFB',
          width: 200 } }
      */
        var profilePic = response.data.url;
        function saveImageToDisk(url, localPath) {
          var file = fs.createWriteStream(localPath);
          var request = https.get(url, function (response) {
            response.pipe(file);
          });
        }
        var firstName = "";
        var lastName = req.user._json.last_name;
        var simpleFirstName = "";
        var simpleLastName = simplifyName(lastName);
        var res = req.user._json.first_name.split(" ");
        var profileImagePath =
          "./public/profilePictures/profPic" + req.user.id + ".png";
        // si res[1] existe quiere decir que el usuario tiene tiene más de un nombre
        if (res[1]) {
          for (var i in res) {
            firstName = firstName.concat(res[i]);
          }
          simpleFirstName = simplifyName(firstName);
          firstName = req.user._json.first_name;
        } else {
          firstName = req.user._json.first_name;
          simpleFirstName = simplifyName(firstName);
        }
        // si currentUser existe entonces entra al if y quiere decir que el usuario ya se encuentra regitrado sino entonces se creará una cuenta nueva
        if (!err && currentUser != null) {
          //console.log('Si está registrado');
          /*var User = mongoose.model('User');
        if(firstName != currentUser.firstName) {
          firstName = firstName;
          simpleFirstName = simpleFirstName;
        } else {
          firstName = currentUser.firstName;
          simpleFirstName = currentUser.simpleFirstName;
        }
        if(lastName != currentUser.lastName) {
          lastName = lastName;
          simpleLastName = simpleLastName;
        } else {
          lastName = currentUser.lastName;
          simpleLastName = currentUser.simpleLastName;
        }*/
          saveImageToDisk(profilePic, profileImagePath);
          fillReqSessionVariables(currentUser, callback);
          /*User.findOneAndUpdate({ _id: currentUser.id }, { $set: { simpleFirstName: simpleFirstName, firstName: firstName, simpleLastName: simpleLastName, lastName: lastName, profilePic: profilePic }}, function (err, doc) {
          if (err) error();
          saveImageToDisk(profilePic, profileImagePath);
          fillReqSessionVariables(currentUser, callback);
        });*/
        } else {
          // console.log('no esta registrado, se creará una cuenta nueva');
          var User = mongoose.model("User", UserSchema);
          var user = new User({
            providerId: req.user.id,
            provider: req.user.provider,
            simpleFirstName: simpleFirstName,
            simpleLastName: simpleLastName,
            firstName: firstName,
            lastName: lastName,
            hexCode: color,
            birthDate: req.user._json.birthday,
            location: req.user._json.location.name,
            profilePic: profilePic,
            //photo: profile.photos[0].value
          });
          user.save(function (err) {
            if (err) throw err;
            saveImageToDisk(profilePic, profileImagePath);
            console.log("Usuario registrado con éxito");
            fillReqSessionVariables(user, callback);
          });
        }
      }
    );
  });
  function fillReqSessionVariables(user, callback) {
    req.user.picture = user.profilePic;
    req.user.name.hexCode = user.hexCode;
    req.user.name.givenName = user.firstName;
    req.session.idMongoDb = user.id;
    req.session.simpleFirstName = user.simpleFirstName;
    req.session.simpleLastName = user.simpleLastName;
    req.session.hexCode = user.hexCode;
    req.session.profilePic = user.profilePic;
    callback();
  }
};

/*
 * @descrip Retorna posts por un usuario en particular
 * @par {object} req, {function} callback, {function} error.
 * @return {object} posts
 */
UserSchema.statics.getPostsByUser = function (req, callback, error) {
  var resultsLimit = 20;
  var queryNumber = 0;
  var currentUserId = req.session.idMongoDb;
  if (req.params.i != undefined) {
    queryNumber = parseInt(req.params.i);
  }

  var path = req.session.path.split(".");
  var hexCode = path[0];
  var simpleFirstName = path[1];
  this.findOne({ _id: currentUserId })
    .populate({
      path: "posts",
      match: {
        active: true,
      },
    })
    .select("reportedPosts")
    .exec(function (err, user) {
      if (err) return handleError(err);
      var User = mongoose.model("User", UserSchema);
      User.findOne({ hexCode: hexCode, simpleFirstName: simpleFirstName })
        .populate({
          path: "posts",
          match: {
            $and: [{ _id: { $nin: user.reportedPosts } }, { active: true }],
          },
          options: {
            skip: resultsLimit * queryNumber,
            limit: resultsLimit,
            sort: { createdAt: -1 },
          },
        })
        .exec(function (err, post) {
          if (post != null) {
            callback(post.posts);
          } else {
            console.log("NO EXISTE tal autor");
            error();
          }
        });
    });
};

/*
 * @descrip Retorna posts por un canal en particular por ejemplo 3bc.jose@casa
 * @par {object} req, {function} callback, {function} error.
 * @return {object} posts
 */
UserSchema.statics.getPostsByChannel = function (req, callback, error) {
  var User = mongoose.model("User");
  var Tag = mongoose.model("Tag");

  var resultsLimit = 20;
  var queryNumber = 0;
  var currentUserId = req.session.idMongoDb;

  if (req.params.i != undefined) {
    queryNumber = parseInt(req.params.i);
  }
  var path = req.session.path.split(".");
  var hexCode = path[0];
  var simpleFirstName = path[1];
  var tagName = path[2];

  Tag.findOne({ tag: tagName }, "_id", function (err, tag) {
    if (tag != null) {
      User.findOne({ _id: currentUserId })
        .populate({
          path: "posts",
          match: {
            active: true,
          },
        })
        .select("reportedPosts")
        .exec(function (err, user) {
          if (err) return handleError(err);
          User.findOne({ hexCode: hexCode, simpleFirstName: simpleFirstName })
            .populate({
              path: "posts savedPosts",
              match: {
                $and: [
                  { tagId: tag.id },
                  { active: true },
                  { _id: { $nin: user.reportedPosts } },
                ],
              },
              options: {
                skip: resultsLimit * queryNumber,
                limit: resultsLimit,
                sort: { createdAt: -1 },
              },
            })
            .exec(function (err, user) {
              if (err) return handleError(err);
              if (user != null) {
                var posts = user.posts.concat(user.savedPosts);
                callback(posts);
              } else {
                console.log("NO EXISTE tal autor");
                error();
              }
            });
        });
    } else {
      console.log("NO EXISTE tal evento");
      error();
    }
  });
};

/*
 * @descrip Remueve tildes de las vocales y retorna un string en minúsculas
 * @par {string} userName
 * @return {string} userName
 */
function simplifyName(userName) {
  console.log("simplifyName " + userName);
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
    userName = userName.replace(diacritics[i].re, diacritics[i].ch);
  }
  return userName.toLowerCase();
}

module.exports = mongoose.model("User", UserSchema);
