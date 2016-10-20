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
  name: String,
  familyName: String,
  hexCode: String,
  actions : [{ type: Schema.Types.ObjectId, ref: 'Action' }],
  savedActions : [{ type: Schema.Types.ObjectId, ref: 'Action' }],
  reportedActions : [{ type: Schema.Types.ObjectId, ref: 'Action' }],
  channels: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  blockedUsers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  createdAt: {type: Date, default: Date.now}
});

UserSchema.statics.signUp = function (req, callback, error) {
  this.findOne({providerId: req.user.id}, function(err, user) {
    if(err) throw(err);
    var letters = '0123456789abcdef'.split('');
    var color = '';
    for (var i = 0; i < 3; i++ ) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    if(!err && user!= null) {
      console.log('el usuario ya se enuentra logueado');
      fillReqSessionVariables(user, callback);
    } else {
      console.log('no esta logueado, se creara uno');
      var User = mongoose.model('User', UserSchema);
      var user = new User({
        providerId: req.user.id,
        provider: req.user.provider,
        name: req.user.name.givenName,
        familyName: req.user.name.familyName,
        hexCode: color
        //photo: profile.photos[0].value
      });
      user.save(function(err) {
        if(err) throw err;
        console.log('Se logueo al usuario satisfoctoriamente');
        fillReqSessionVariables(user, callback);
      });
    }
  });
  function fillReqSessionVariables(user, callback) {
    req.session.idMongoDb = user.id;
    req.session.name = user.name;
    req.session.familyName = user.familyName;
    req.session.hexCode = user.hexCode;
    callback();
  }
}

UserSchema.statics.getProfilePicture = function (req, callback) {
  var profilePic;
  var idProfile = req.session.passport.user.id;
  FB.api('/v2.8/'+idProfile+'?fields=picture.width(200).height(200)',  function(response) {
    profilePic = response.picture.data.url;
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
    getImg({
      url: profilePic,
      dest: "./public/images/profPic"+req.session.id+".png"
    },function(err){
      req.session.passport.user.picture = profilePic;
      callback();
    })
  });
}

UserSchema.statics.getActionsByUser = function (req, callback, error) {
  var resultsLimit = 20;
  var queryNumber = 0;

  if(req.params.i!=undefined) {
    queryNumber = parseInt(req.params.i);
  }

  var userId = req.session.path[1].split('.')
  var hexCode = userId[0];
  var nameuser = userId[1];
  this.findOne({hexCode: hexCode, name: nameuser})
  .populate({
    path: 'actions savedActions',
    match: {active: true, geo: {$near: {$geometry: {type: "Point",  coordinates: [req.session.coords.longitude, req.session.coords.latitude]}}}},
    options: {skip: resultsLimit*queryNumber, limit: resultsLimit}
  })
  .exec(function (err, user) {
    if (err) return handleError(err);
    if(user != null) {
      callback(user.actions);
    } else {
      console.log('NO EXISTE tal autor');
      error();
    }
  })
}

UserSchema.statics.getActionsByChannel = function (req, callback, error) {
  var User = mongoose.model('User');
  var Tag = mongoose.model('Tag');

  var resultsLimit = 20;
  var queryNumber = 0;

  if(req.params.i!=undefined) {
    queryNumber = parseInt(req.params.i);
  }

  var userId = req.session.path[1].split('.')
  var hexCode = userId[0];
  var nameuser = userId[1];
  var tagName = req.session.path[2];

  var simpleEventName = tagName;
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
    simpleEventName = simpleEventName.replace(diacritics[i],chars[i]);
  }
  tagName = simpleEventName.toLowerCase();
  Tag.findOne({ 'name': tagName }, '_id', function (err, tag) {
    if(tag!= null) {
      User.findOne({hexCode: hexCode, name: nameuser})
      .populate({
        path: 'actions',
        match: { tagId: tag.id,
                 active: true,
                 geo: {$near: {$geometry: {type: "Point",  coordinates: [req.session.coords.longitude, req.session.coords.latitude]}}}},
        options: {skip: resultsLimit*queryNumber, limit: resultsLimit}
      })
      .exec(function (err, user) {
        if (err) return handleError(err);
        if(user != null) {
          callback(user.actions);
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

module.exports = mongoose.model('User', UserSchema);