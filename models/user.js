var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var FB = require('fb');
var fs = require('fs');
var http = require('http');
var url = require('url');

var UserSchema = new Schema({
  providerId: {type: String, unique: true},
  provider: String,
  name: String,
  familyName: String,
  userName: String,
  hexCode: String,
  actions : [{ type: Schema.Types.ObjectId, ref: 'Action' }],
  channels: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  blockedUsers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  createdAt: {type: Date, default: Date.now}
});

UserSchema.statics.signUp = function (req, callback, error) {
  this.findOne({providerId: req.user.id}, function(err, user) {
    if(err) throw(err);
    if(!err && user!= null) {
      console.log('el usuario ya se enuentra logueado');
      req.session.idMongoDb = user.id;
      req.session.name = user.name;
      req.session.familyName = user.familyName;
      req.session.userName = user.userName;
      callback();
    } else {
      console.log('no esta logueado, se creara uno');
      var User = mongoose.model('User', UserSchema);
      var user = new User({
        providerId: req.user.id,
        provider: req.user.provider,
        name: req.user.name.givenName,
        familyName: req.user.name.familyName,
        userName: req.user.name.givenName,
        //photo: profile.photos[0].value
      });
      user.save(function(err) {
        if(err) throw err;
        req.session.idMongoDb = user.id;
        req.session.name = user.name;
        req.session.familyName = user.familyName;
        req.session.userName = user.userName;
        console.log('Se logueo al usuario satisfoctoriamente');
        callback();
      });
    }
  });
}

UserSchema.statics.getProfilePicture = function (req, callback) {
  var profilePic;
  var idProfile = req.session.passport.user.id;
  FB.api('/'+idProfile+'/picture?redirect=0&height=200&type=normal&width=200',  function(response) {
    profilePic = response.data.url;
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

/*UserSchema.statics.getActionsByAuthor = function (nameAuthor, callback) {
  return this.findOne({name: nameAuthor})
          .populate('actions')
          .exec(callback)
}*/

UserSchema.statics.getActionsByAuthor = function (req, callback, error) {
  var posts = [];
  var point = {};
  if(req.session.jUser.coords != undefined) {
    point.latitude = req.session.jUser.coords.latitude;
    point.longitude = req.session.jUser.coords.longitude;
  } else { // Arequipa
    point.latitude = -16.3989;
    point.longitude = -71.535;
  }

  var resultsLimit = 10;
  var queryNumber = 0;
  var queryTimeLimitStep = 24*20;
  var countActions;

  if(req.params.i!=undefined) {
    queryNumber = parseInt(req.params.i);
  } else {
    req.session.queryTimeLimit = queryTimeLimitStep;
  }

  var nameAuthor = req.params.id;
  this.findOne({name: nameAuthor})
  .populate('actions')
  .exec(function (err, author) {
    if (err) return handleError(err);
    if(author != null) {
      if(author.actions.length == 0) {
        callback(author.actions);
      }
      countActions = author.actions.length; //results.length;
      for(var i in author.actions) {
        posts[i] = {}; //console.log('action.author.name: ' + query[0].author[0].name);
        posts[i].id = author.actions[i]._id;
        posts[i].fbId = author.providerId;
        posts[i].authorId = author.actions[i].authorId;
        posts[i].event = author.actions[i].name;
        posts[i].time = author.actions[i].createdAt;
        posts[i].media = author.actions[i].media;
        posts[i].location = {};
        posts[i].location.latitude = author.actions[i].geo[0];
        posts[i].location.longitude = author.actions[i].geo[1];
        getFBInfo(i, posts[i].fbId);
      }
    } else {
      console.log('NO EXISTE tal autor');
      error();
    }
  })
  function getFBInfo(i, fbUserId) { //function getFBInfo(i, fbUserId, idKey)
    FB.api('/'+fbUserId+'/', {access_token: req.session.passport.user.accessToken},  function(profile) {
      posts[i].author = {};
      //posts[i].author.idKey = idKey;
      posts[i].author.firstName = profile.first_name;
      posts[i].author.lastName = profile.last_name;
      FB.api('/'+fbUserId+'/picture?redirect=0&height=200&type=normal&width=200',  function(picture) {
        posts[i].author.picture= picture.data.url;
        triggerNext();
      });
    });
  }
  function triggerNext() {
    countActions--;
    if(countActions===0) {
      var response = {posts: posts};
      callback(response);
    }
  }
}

/*var User = mongoose.model('User', UserSchema);
var Action = mongoose.model('Action', ActionSchema);
var Tag = mongoose.model('Tag', TagSchema);*/
module.exports = mongoose.model('User', UserSchema);