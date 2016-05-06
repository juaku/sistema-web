var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var fs = require('fs');
var FB = require('fb');

require('./user');
require('./action');
var User = mongoose.model('User');
var Action = mongoose.model('Action');

var TagSchema = new Schema({
	name: String,
	originalName : String,
	actions : [{ type: Schema.Types.ObjectId, ref: 'Action' }],
	createdAt: {type: Date, default: Date.now}
});

/*TagSchema.statics.getActionsByTag = function (tagName, callback) {
	return this.findOne({name: tagName})
					.populate('actions')
					.exec(callback)
}*/

TagSchema.statics.getActionsByTag = function (req, callback, error) {
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

	var simpleEventName = req.params.id;
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
	var tagName = simpleEventName.toLowerCase();
	this.findOne({name: tagName})
	.populate('actions')
	.exec(function (err, tag) {
		if (err) return handleError(err);
		if(tag != null) {
			if(tag.actions.length == 0) {
				callback(tag.actions);
			}
			countActions = tag.actions.length; //results.length;
			for(var i in tag.actions) {
				posts[i] = {}; //console.log('action.author.name: ' + query[0].author[0].name);
				posts[i].id = tag.actions[i]._id;
				getProviderId(tag.actions[i].authorId, i);
				posts[i].authorId = tag.actions[i].authorId;
				posts[i].event = tag.actions[i].name;
				posts[i].time = tag.actions[i].createdAt;
				posts[i].media = './uploads/' + tag.actions[i].media;
				posts[i].location = {};
				posts[i].location.latitude = tag.actions[i].geo[0];
				posts[i].location.longitude = tag.actions[i].geo[1];
			}
		} else {
			console.log('NO EXISTE tal tag');
			error();
		}
	})
	function getProviderId(id, i) {
		User.findById(id, 'providerId hexCode', function (err, user) {
			posts[i].fbId = user.providerId;
			getFBInfo(i, posts[i].fbId, user.hexCode);
		});
	}
	function getFBInfo(i, fbUserId, hexCode) { //function getFBInfo(i, fbUserId, idKey)
		FB.api('/'+fbUserId+'/', {access_token: req.session.passport.user.accessToken},  function(profile) {
			posts[i].author = {};
			//posts[i].author.idKey = idKey;
			posts[i].author.firstName = profile.first_name;
			posts[i].author.lastName = profile.last_name;
			posts[i].author.hexCode = hexCode;
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

TagSchema.statics.newAction = function (req, tagName, mediaName, mediaExt, userId, callback) { //revisar si estoy enviando función error
	var newAction = req.body;
	console.log('\x1b[1m\x1b[35m@@@ newAction @@@\x1b[0m');
	console.log(req.body);
	var FB = require('fb');
	var coords = [];
	coords[0] = newAction.coords.latitude;
	coords[1] = newAction.coords.longitude;
	this.findOne({name: tagName}, function(err, tag) {
		var objectTag = tag;
		saveMedia(newAction.media, mediaName, mediaExt);
		if(err) throw(err);
		console.log(coords);
		var action = new Action({
			name: newAction.eventName,
			geo: coords,
			media: mediaName + '.' + mediaExt,
			active: true,
			authorId: userId
		});
		action.save(function(err) {
			if(err) throw err;
			User.update({ _id: userId }, { $push: { actions: action._id }}, function (err, doc) {
				if (err) return handleError(err);
				console.log('accion referenciada a user');
				console.log(doc);
			});
			if(objectTag!= null) {
				objectTag.actions.push(action._id);
				objectTag.save();
				console.log('Acción referenciada a tag');
				callback();
			} else {
				var Tag = mongoose.model('Tag', TagSchema);
				var tag = new Tag(); //TypeError: object is not a function con: this()
				tag.name = tagName;
				tag.originalName = newAction.eventName;
				tag.actions = action._id;
				tag.save(function (err) {
					if (err) return handleError(err);
					console.log('Tag guardado y acción referenciada');
					callback();
				});
			}
		});
		if(newAction.shareOnFb) {
			var url = 'http://juaku-dev.cloudapp.net:3000/uploads/' + mediaName + '.' + mediaExt;
			shareMediaOnFb(req, url);
		}
		function shareMediaOnFb(req, url) {
			var albumId = '';
			FB.api('/' + albumId + '/photos','POST',
				{
					'url': url,
					'access_token': req.session.accessToken
				},
					function (response) {
						if (response && !response.error) {
							// handle the result
							console.log('Foto compartida en facebook exitósamente');
						} else {
							console.log('Error, foto no compartida');
						}
					}
			);
		}
	});
	function saveMedia(data, name, ext, next) {
		var img = data;
		// Strip off the data: url prefix to get just the base64-encoded bytes
		var data = img.replace(/^data:image\/\w+;base64,/, "");
		var buf = new Buffer(data, 'base64');
		// TODO: Verificación de archivo
		fs.writeFile('./public/uploads/'+ name +'.'+ ext, buf);
		console.log('IMAGEN GUARDADA EN SERVIDOR!!!!!!!!');
		//next(data); || return data;
	}
}

module.exports = mongoose.model('Tag', TagSchema);