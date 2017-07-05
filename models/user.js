var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var FB = require('fb');
var fs = require('fs');
var http = require('http');
var url = require('url');
require('./tag');

var UserSchema = new Schema({
  providerId: {type: String, unique: true},
  provider: String,
  firstName: String,
  lastName: String,
  originalFirstName: String,
  originalLastName: String,
  hexCode: String,
  posts : [{ type: Schema.Types.ObjectId, ref: 'Post' }],
  savedPosts : [{ type: Schema.Types.ObjectId, ref: 'Post' }],
  reportedPosts : [{ type: Schema.Types.ObjectId, ref: 'Post' }],
  channels: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  blockedUsers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  createdAt: {type: Date, default: Date.now},
  profilePic: String
});

UserSchema.statics.signUp = function (req, callback, error) {
  this.findOne({providerId: req.user.id}, function(err, user) {
    var currentUser = user;
    if(err) throw(err);
    var letters = '0123456789abcdef'.split('');
    var color = '';
    for (var i = 0; i < 3; i++ ) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    FB.api('/v2.8/'+ req.user.id +'?fields=picture.width(200).height(200)', {access_token: req.user.accessToken}, function(response) {
      var profilePic = response.picture.data.url;
      var getImg = function(o, cb){
        var port = o.port || 80;
        var parsed = url.parse(o.url);
        var options = {
          host: parsed.hostname,
          port: port,
          path: parsed.path
        };
        http.get(options, function(res) {
          res.setEncoding('binary');
          var imagedata = '';
          res.on('data', function(chunk){
            imagedata+= chunk;
          });
          res.on('end', function(){
            fs.writeFile(o.dest, imagedata, 'binary', cb);
          });
        }).on('error', function(e) {
            console.log("Got error: " + e.message);
          });
      }
      if(!err && currentUser!= null) {
        console.log('el usuario ya se registró');
        var User = mongoose.model('User');
        User.update({ _id: currentUser.id }, { $set: { profilePic: profilePic }}, function (err, doc) {
          if (err) error();
          fillReqSessionVariables(currentUser, callback);
        });
      } else {
        console.log('no esta registrado, se creará una cuenta nueva');
        var firstName = simplifyName(req.user.name.givenName);
        var lastName = simplifyName(req.user.name.familyName);
        var User = mongoose.model('User', UserSchema);
        var user = new User({
          providerId: req.user.id,
          provider: req.user.provider,
          firstName: firstName,
          lastName: lastName,
          originalFirstName: req.user.name.givenName,
          originalLastName: req.user.name.familyName,
          hexCode: color,
          profilePic: profilePic
          //photo: profile.photos[0].value
        });
        user.save(function(err) {
          if(err) throw err;
          getImg({
            url: profilePic,
            dest: "./public/images/profPic"+req.session.id+".png"
          },function(err){
          })
          console.log('Se logueo al usuario satisfoctoriamente');
          fillReqSessionVariables(user, callback);
        });
      }
    });
  });
  function fillReqSessionVariables(user, callback) {
    req.user.picture = user.profilePic;
    req.user.name.hexCode = user.hexCode;
    req.session.idMongoDb = user.id;
    req.session.firstName = user.firstName;
    req.session.lastName = user.lastName;
    req.session.hexCode = user.hexCode;
    req.session.profilePic = user.profilePic;
    callback();
  }
}

UserSchema.statics.getUserId = function (req, callback, error) {
  var path = req.session.path.split('.')
  var hexCode = path[0];
  var firstName = path[1];
  this.findOne({hexCode: hexCode, firstName: firstName}).select('firstName')
  .exec(function (err, user) {
    if (err) return handleError(err);
    if(user != null) {
      callback(user);
    } else {
      console.log('NO EXISTE tal autor');
      error();
    }
  })
}

UserSchema.statics.getPostsByChannel = function (req, callback, error) {
  var User = mongoose.model('User');
  var Tag = mongoose.model('Tag');

  var resultsLimit = 20;
  var queryNumber = 0;

  if(req.params.i!=undefined) {
    queryNumber = parseInt(req.params.i);
  }

  var path = req.session.path.split('.')
  var hexCode = path[0];
  var firstName = path[1];
  var tagName = path[2];

  Tag.findOne({ 'tag': tagName }, '_id', function (err, tag) {
    if(tag!= null) {
      User.findOne({hexCode: hexCode, firstName: firstName})
      .populate({
        path: 'posts savedPosts',
        match: { tagId: tag.id,
                 active: true//,
                 //geo: { $geoWithin: {$center: [[req.session.coords.longitude, req.session.coords.latitude], 500]} }
               },
        options: {skip: resultsLimit*queryNumber, limit: resultsLimit, sort: { createdAt: -1 }}
      })
      .exec(function (err, user) {
        if (err) return handleError(err);
        if(user != null) {
          var posts = user.posts.concat(user.savedPosts);
          callback(posts);
        } else {
          console.log('NO EXISTE tal autor');
          error();
        }
      })
    } else {
      console.log('NO EXISTE tal evento');
      error();
    }
  });
}

function simplifyName(userName) {
  console.log('simplifyName ' + userName);
  var diacritics =[
    /[\300-\306]/g, /[\340-\346]/g,  // A, a
    /[\310-\313]/g, /[\350-\353]/g,  // E, e
    /[\314-\317]/g, /[\354-\357]/g,  // I, i
    /[\322-\330]/g, /[\362-\370]/g,  // O, o
    /[\331-\334]/g, /[\371-\374]/g,  // U, u
    /[\321]/g, /[\361]/g, // N, n
    /[\307]/g, /[\347]/g, // C, c
  ];
  var chars = ['A','a','E','e','I','i','O','o','U','u','N','n','C','c'];
  for (var i = 0; i < diacritics.length; i++) {
    userName = userName.replace(diacritics[i],chars[i]);
  }
  return userName.toLowerCase();
}

module.exports = mongoose.model('User', UserSchema);