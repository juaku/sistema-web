var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var FB = require('fb');
var fs = require('fs');
var http = require('http');
var url = require('url');
require('./tag');
require('./action');

var UserSchema = new Schema({
  providerId: {type: String, unique: true},
  provider: String,
  simpleFirstName: String,
  simpleLastName: String,
  firstName: String,
  lastName: String,
  hexCode: String,
  posts : [{ type: Schema.Types.ObjectId, ref: 'Post' }],
  savedPosts : [{ type: Schema.Types.ObjectId, ref: 'Post' }],
  reportedPosts : [{ type: Schema.Types.ObjectId, ref: 'Post' }],
  channels: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  blockedUsers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  createdAt: {type: Date, default: Date.now},
  profilePic: String
});

/*
 * @descrip Busca el id de fb del usuario que ingresa, si está registrado sus datos serán retornado y sino registrará un usuario nuevo retornando sus datos
 * @par {object} req, {function} callback, {function} error.
 * @return null
 */
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
      var firstName = "";
      var lastName = req.user.name.familyName;
      var simpleFirstName = "";
      var simpleLastName = simplifyName(req.user.name.familyName);
      var res = req.user.name.givenName.split(" ");
      if(res[1]) {
        for(var i in res) {
          firstName = firstName.concat(res[i]);
        }
        simpleFirstName = simplifyName(firstName);
        firstName = req.user.name.givenName;
      } else {
        firstName = req.user.name.givenName;
        simpleFirstName = simplifyName(firstName);
      }
      if(!err && currentUser!= null) {
        console.log('Si está registrado');
        var User = mongoose.model('User');
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
        }
        User.findOneAndUpdate({ _id: currentUser.id }, { $set: { simpleFirstName: simpleFirstName, firstName: firstName, simpleLastName: simpleLastName, lastName: lastName, profilePic: profilePic }}, function (err, doc) {
          if (err) error();
          fillReqSessionVariables(currentUser, callback);
        });
      } else {
        console.log('no esta registrado, se creará una cuenta nueva');
        var User = mongoose.model('User', UserSchema);
        var user = new User({
          providerId: req.user.id,
          provider: req.user.provider,
          simpleFirstName: simpleFirstName,
          simpleLastName: simpleLastName,
          firstName: firstName,
          lastName: req.user.name.familyName,
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
    req.user.name.givenName = user.firstName;
    req.session.idMongoDb = user.id;
    req.session.simpleFirstName = user.simpleFirstName;
    req.session.simpleLastName = user.simpleLastName;
    req.session.hexCode = user.hexCode;
    req.session.profilePic = user.profilePic;
    callback();
  }
}

/*
 * @descrip Retorna posts por un usuario en particular
 * @par {object} req, {function} callback, {function} error.
 * @return {object} posts
 */
UserSchema.statics.getPostsByUser = function (req, callback, error) {
  var resultsLimit = 20;
  var queryNumber = 0;
  var currentUserId = req.session.idMongoDb;
  if(req.params.i!=undefined) {
    queryNumber = parseInt(req.params.i);
  }

  var path = req.session.path.split('.')
  var hexCode = path[0];
  var simpleFirstName = path[1];
  this.findOne({_id: currentUserId})
  .populate({
    path: 'posts',
    match: {
      active: true
    }
  })
  .select('reportedPosts')
  .exec(function (err, user) {
    if (err) return handleError(err);
    var User = mongoose.model('User', UserSchema);
    User.findOne({hexCode: hexCode, simpleFirstName: simpleFirstName})
    .populate({
      path: 'posts',
      match: {
        $and: [
          {_id: {$nin: user.reportedPosts}},
          {active: true}
        ]
      },
      options: {skip: resultsLimit*queryNumber, limit: resultsLimit, sort: { createdAt: -1 }}
    })
    .exec(function (err, post) {
      if(post != null) {
        callback(post.posts);
      } else {
        console.log('NO EXISTE tal autor');
        error();
      }
    })
  })
}

/*
 * @descrip Retorna posts por un canal en particular por ejemplo 3bc.jose@casa
 * @par {object} req, {function} callback, {function} error.
 * @return {object} posts
 */
UserSchema.statics.getPostsByChannel = function (req, callback, error) {
  var User = mongoose.model('User');
  var Tag = mongoose.model('Tag');

  var resultsLimit = 20;
  var queryNumber = 0;
  var currentUserId = req.session.idMongoDb;

  if(req.params.i!=undefined) {
    queryNumber = parseInt(req.params.i);
  }
  var path = req.session.path.split('.')
  var hexCode = path[0];
  var simpleFirstName = path[1];
  var tagName = path[2];

  Tag.findOne({ 'tag': tagName }, '_id', function (err, tag) {
    if(tag!= null) {
      User.findOne({_id: currentUserId})
      .populate({
        path: 'posts',
        match: {
          active: true
        }
      })
      .select('reportedPosts')
      .exec(function (err, user) {
        if (err) return handleError(err);
        User.findOne({hexCode: hexCode, simpleFirstName: simpleFirstName})
        .populate({
          path: 'posts savedPosts',
          match: {
            $and: [
              {tagId: tag.id},
              {active: true},
              {_id: {$nin: user.reportedPosts}}
            ]
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
      })
    } else {
      console.log('NO EXISTE tal evento');
      error();
    }
  });
}

/*
 * @descrip Remueve tildes de las vocales y retorna un string en minúsculas
 * @par {string} userName
 * @return {string} userName
 */
function simplifyName(userName) {
  console.log('simplifyName ' + userName);
  var diacritics = [
    {re:/[\xC0-\xC6]/g, ch:'A'},
    {re:/[\xE0-\xE6]/g, ch:'a'},
    {re:/[\xC8-\xCB]/g, ch:'E'},
    {re:/[\xE8-\xEB]/g, ch:'e'},
    {re:/[\xCC-\xCF]/g, ch:'I'},
    {re:/[\xEC-\xEF]/g, ch:'i'},
    {re:/[\xD2-\xD6]/g, ch:'O'},
    {re:/[\xF2-\xF6]/g, ch:'o'},
    {re:/[\xD9-\xDC]/g, ch:'U'},
    {re:/[\xF9-\xFC]/g, ch:'u'},
    {re:/[\xD1]/g, ch:'N'},
    {re:/[\xF1]/g, ch:'n'},
    {re:/[\307]/g, ch:'C'},
    {re:/[\347]/g, ch:'c'}
  ];
  for (var i = 0; i < diacritics.length; i++) {
    userName = userName.replace(diacritics[i].re, diacritics[i].ch);
  }
  return userName.toLowerCase();
}

module.exports = mongoose.model('User', UserSchema);